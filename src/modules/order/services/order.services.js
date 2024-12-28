const { sequelize } = require('../../../config/database');

const Order = require('../models/order');
const OrderItem = require('../models/orderItem');

const Customer = require('../../customer/models/customer');
const cartService = require('../../cart/services/cart.services');
const customerServices = require('../../customer/services/customer.services');
const productService = require('../../product/services/product.services');
const shippingService = require('../../shipping/services/shipping.services');
const paymentService = require('../../payment/services/payment.services');
const Product = require('../../product/models/product');
const Cart = require('../../cart/models/cart');
const moment = require('moment');
const OrderItems = require('../models/orderItem');


const { default: Decimal } = require('decimal.js');

const { encrypt, decrypt } = require('../../../utils/encryption.utils');
const PaymentTypeEnum = require('../../payment/enums/payment.enums');
const { OrderStatusEnum } = require('../enums/order.enums');
const CartItem = require('../../cart/models/cartItems');
const vnpayServices = require('../../payment/services/vnpay.services');
const paymentServices = require('../../payment/services/payment.services');

class OrderService {

    async findAllByUserId(userId, page = 1, limit = 1) {
        const customer = await Customer.findOne({ where: { user_id: userId } });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const offset = (page - 1) * limit;
        const { rows: orders, count } = await Order.findAndCountAll({
            where: { customer_id: customer.id },
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });
        await Promise.all(orders.map(async (order) => {
            order.dataValues.orderItems = await OrderItem.findAll({
                where: { order_id: order.id },
                include: [
                    {
                        model: Product,
                        as: 'product'
                    }
                ]
            });
            const paymentDetails = await paymentService.getPaymentDetailsByOrderId(order.id);
            order.dataValues.paymentDetails = paymentDetails ? paymentDetails.get({ plain: true }) : null;
        }));
        return {
            orders: orders.map(order => function() {
                const plainOrder = order.get({ plain: true });
                plainOrder.hashOrderId = encrypt(order.id.toString());
                plainOrder.statusName = OrderStatusEnum.properties[order.status].name;
                plainOrder.created_at = moment(order.created_at).format('MMMM Do YYYY, h:mm:ss a');
                return plainOrder;
            }()),
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async checkout(userId) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const customer = await customerServices.getByUserId(userId);
                const cart = await cartService.getCartByCustomerId(customer.id);
                if (!cart || cart.amount_of_items === 0) {
                    throw new Error('Cart is empty');
                }
                const cartItems = await cartService.getCartItemsByCartId(cart.id);

                const orderItems = [];

                let subtotal = 0; // double check in case the price is updated at the time of checkout
                let amountOfItemsInOrder = 0;

                const handleItems = cartItems.map(async (cartItem) => {
                    orderItems.push({
                        product:{
                            id: cartItem.product.id,
                            name: cartItem.product.name,
                            image: cartItem.product.image_urls
                        },
                        quantity: cartItem.quantity,
                        product_price: cartItem.product.price,
                        product_id: cartItem.product.id,
                        cart_item_id: cartItem.id,
                    });
                    subtotal = Decimal.add(subtotal, Decimal.mul(cartItem.product.price, cartItem.quantity));
                    amountOfItemsInOrder += cartItem.quantity;
                });

                await Promise.all(handleItems);

                const order ={
                    customer_id: customer.id,
                    amount_of_items: amountOfItemsInOrder,
                    subtotal: subtotal,
                    total_price: subtotal
                }

                order.orderItems = orderItems;
                return order;

            });
        }
        catch (err) {
            console.log(err);
            throw new Error('Error creating order: ' + err.message);
        }
    }

    
    async fetchOrderById(orderId) {
        // Fetch the complete order information with associations
        const completeOrder = await Order.findOne({
            where: { id: orderId },
            include: [
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });

        if(!completeOrder) {
            throw new Error('Order not found');
        }

        // Fetch the order items
        const orderItems = await OrderItem.findAll({
            where: { order_id: orderId },
            include: [
                {
                    model: Product,
                    as: 'product'
                }
            ]
        });

        // Convert order items to plain objects
        completeOrder.dataValues.orderItems = orderItems.map(item => item.get({ plain: true }));
        const paymentDetails = await paymentService.getPaymentDetailsByOrderId(orderId);
        completeOrder.dataValues.paymentDetails = paymentDetails ? paymentDetails.get({ plain: true }) : null;

        return completeOrder.get({ plain: true });
    }

    async fetchOrderByHashId(hashOrderId) {
        const orderId = parseInt(decrypt(hashOrderId));
        if (isNaN(orderId)) {
            throw new Error('Invalid order ID');
        }
        const order = await this.fetchOrderById(orderId); 
        order.hashOrderId = hashOrderId;
        return order;
    }


    async fetchOrdersByCustomerId(customerId) {
        const orders = await Order.findAll({
            where: { customer_id: customerId },
            include: [
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });
        await Promise.all(orders.map(async (order) => {
            order.dataValues.orderItems = await OrderItem.findAll({
                where: { order_id: order.id },
                include: [
                    {
                        model: Product,
                        as: 'product'
                    }
                ]
            });
        }));
        return orders;
    }

    async confirmOrder(order, shippingDetails, paymentType) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const newOrder = await Order.create({
                    customer_id: order.customer_id,
                    total_price: Decimal.add(order.total_price, shippingDetails.shipping_fee),
                    subtotal: order.subtotal,
                    amount_of_items: order.amount_of_items,
                    status: OrderStatusEnum.CONFIRMED.value,
                    expired_at: null
                }, { transaction });

                const cart = await cartService.getCartByCustomerId(order.customer_id);

                await Promise.all(order.orderItems.map(async (orderItem) => {
                    await OrderItems.create({
                        order_id: newOrder.id,
                        product_id: orderItem.product_id,
                        quantity: orderItem.quantity,
                        product_price: orderItem.product_price
                    }, { transaction });
                    await productService.updateProductInventory(orderItem.product_id, orderItem.quantity, { transaction });
                    const cartItem = await CartItem.findByPk(orderItem.cart_item_id);
                    if(cartItem.quantity === orderItem.quantity){
                        await cartItem.destroy({ transaction });
                        cart.amount_of_items--;
                    }
                    else{
                        await cartItem.update({quantity: cartItem.quantity - orderItem.quantity}, { transaction });
                    }
                    cart.total_price = Decimal.sub(cart.total_price, Decimal.mul(orderItem.product_price, orderItem.quantity));

                }));
                await cart.update({ amount_of_items: cart.amount_of_items, total_price: cart.total_price }, { transaction });
                await shippingService.createShipment(newOrder.id, shippingDetails, { transaction });
                await paymentService.createPayment(newOrder, paymentType, { transaction });
                return encrypt(newOrder.id.toString());
            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error confirming order: ${err.message}`);
        }
    }

    async payWithVNPay(order, shippingDetails, paymentType, formDataJson) {
        try {
            return await sequelize.transaction(async (transaction) => {
                // Create new order
                const newOrder = await Order.create({
                    customer_id: order.customer_id,
                    total_price: Decimal.add(order.total_price, shippingDetails.shipping_fee),
                    subtotal: order.subtotal,
                    amount_of_items: order.amount_of_items,
                    status: OrderStatusEnum.PENDING.value // Use PENDING until payment is confirmed,
                }, { transaction });
    
                // Fetch cart for the customer
                const cart = await cartService.getCartByCustomerId(order.customer_id);
    
                // Process order items
                await Promise.all(order.orderItems.map(async (orderItem) => {
                    // Create order item records
                    await OrderItems.create({
                        order_id: newOrder.id,
                        product_id: orderItem.product_id,
                        quantity: orderItem.quantity,
                        product_price: orderItem.product_price
                    }, { transaction });
    
                    // Update product inventory
                    await productService.updateProductInventory(orderItem.product_id, orderItem.quantity, { transaction });
    
                    // Handle cart item removal/update
                    const cartItem = await CartItem.findByPk(orderItem.cart_item_id);
                    if (cartItem.quantity === orderItem.quantity) {
                        await cartItem.destroy({ transaction });
                        cart.amount_of_items--;
                    } else {
                        await cartItem.update({ quantity: cartItem.quantity - orderItem.quantity }, { transaction });
                    }
    
                    // Update cart total price
                    cart.total_price = Decimal.sub(cart.total_price, Decimal.mul(orderItem.product_price, orderItem.quantity));
                }));
    
                // Update cart with new values
                await cart.update({ amount_of_items: cart.amount_of_items, total_price: cart.total_price }, { transaction });
    
                // Create shipment details
                await shippingService.createShipment(newOrder.id, shippingDetails, { transaction });
    
                // Generate payment URL with VNPay
                const hashedOrderId = encrypt(newOrder.id.toString());
                const paymentUrl = await paymentService.createVNPayUrl(hashedOrderId, formDataJson, { transaction });
    
                // Return payment URL for redirection
                return paymentUrl;
            });
        } catch (err) {
            console.error(err);
            throw new Error(`Error processing VNPay payment: ${err.message}`);
        }
    }
    

    async confirmVnPaySuccess(verifiedParams) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const hashOrderId = verifiedParams['vnp_TxnRef'];
                const orderId = parseInt(decrypt(hashOrderId));
                const order = await Order.findByPk(orderId);
                if (!order) {
                    throw new Error('Order not found');
                }
                if (order.status !== OrderStatusEnum.PENDING.value) {
                    throw new Error('Order has already been confirmed');
                }
                await paymentService.createVNPayDetails(orderId, verifiedParams, { transaction });
                await order.update({ status: OrderStatusEnum.PAID.value, expired_at: null }, { transaction });
                return orderId;
            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error confirming VNPay success: ${err.message}`);
        }
    }

    async continueVnPayPayment(hashOrderId) {
        try {
            const order = await this.fetchOrderByHashId(hashOrderId);
            if(!order){
                throw new Error('Order not found');
            }
            if (order.status !== OrderStatusEnum.PENDING.value) {
                throw new Error('Order has already been confirmed');
            }
            const payData = {
                amount: order.total_price,
                bankCode: "",
            }
            const redirectUrl = paymentServices.createVNPayUrl(hashOrderId, payData);
            return redirectUrl;
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error continuing VNPay payment: ${err.message}`);
        }
    }

    async checkoutFailed(hashedOrderId) {
        try {
            const orderId = parseInt(decrypt(hashedOrderId));
            const order = await Order.findByPk(orderId);
            if (!order) {
                throw new Error('Order not found');
            }
            if (order.status !== OrderStatusEnum.PENDING.value) {
                throw new Error('Order has already been processed');
            }
            
            return sequelize.transaction(async (transaction) => {
                // Update order status to CANCELLED
                await order.update({ status: OrderStatusEnum.CANCELLED.value, expired_at: null }, { transaction });
    
                // Retrieve order items and update inventory
                const orderItems = await OrderItems.findAll({ where: { order_id: orderId }, transaction });
    
                await Promise.all(orderItems.map(async (orderItem) => {
                    await productService.updateProductInventory(orderItem.product_id, -orderItem.quantity, { transaction });
                }));
            });
        } catch (err) {
            console.log(err);
            throw new Error(`Error in checkoutFailed workflow: ${err.message}`);
        }
    }
    
}

module.exports = new OrderService();