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
                    // await productService.updateProductInventory(cartItem.product_id, cartItem.quantity, { transaction });
                    orderItems.push({
                        product_id: cartItem.product_id,
                        quantity: cartItem.quantity,
                        product_price: cartItem.product.price,
                        cart_item_id: cartItem.id
                    });
                    subtotal += Decimal.mul(cartItem.product.price, cartItem.quantity);
                    //cartItem.destroy({ transaction });
                    //cart.amount_of_items--;
                    amountOfItemsInOrder += cartItem.quantity;
                    //cart.total_price = Decimal.sub(cart.total_price, Decimal.mul(cartItem.product.price, cartItem.quantity));
                });

                await Promise.all(handleItems);

                //await order.update({ amount_of_items: amountOfItemsInOrder, subtotal: subtotal, total_price: subtotal }, { transaction });
                const order ={
                    customer_id: customer.id,
                    amount_of_items: amountOfItemsInOrder,
                    subtotal: subtotal,
                    total_price: subtotal
                }

                //await cart.update({ amount_of_items: cart.amount_of_items, total_price: cart.total_price }, { transaction });

                //return encrypt(order.id.toString());

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
                    total_price: order.total_price + shippingDetails.shipping_fee,
                    subtotal: order.subtotal,
                    amount_of_items: order.amount_of_items,
                    status: OrderStatusEnum.CONFIRMED.value
                }, { transaction });

                const cart = await cartService.getCartByCustomerId(order.customer_id);

                await Promise.all(order.orderItems.map(async (orderItem) => {
                    await OrderItems.create({
                        order_id: newOrder.id,
                        product_id: orderItem.product_id,
                        quantity: orderItem.quantity,
                        product_price: orderItem.product_price
                    }, { transaction });
                    const product = await productService.getProductById(orderItem.product_id);
                    await productService.updateProductInventory(product, orderItem.quantity, { transaction });
                    const cartItem = await Cart.findByPk(orderItem.cart_item_id);
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
                const newOrder = await Order.create({
                    customer_id: order.customer_id,
                    total_price: order.total_price + shippingDetails.shipping_fee,
                    subtotal: order.subtotal,
                    amount_of_items: order.amount_of_items,
                    status: OrderStatusEnum.PAID.value
                }, { transaction });
    
                const cart = await cartService.getCartByCustomerId(order.customer_id);
    
                await Promise.all(order.orderItems.map(async (orderItem) => {
                    await OrderItems.create({
                        order_id: newOrder.id,
                        product_id: orderItem.product_id,
                        quantity: orderItem.quantity,
                        product_price: orderItem.product_price
                    }, { transaction });
                    const product = await productService.getProductById(orderItem.product_id);
                    await productService.updateProductInventory(product, orderItem.quantity, { transaction });
                    const cartItem = await Cart.findByPk(orderItem.cart_item_id);
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
                const hashOrderId = encrypt(newOrder.id.toString());
                const paymentUrl = await paymentService.createVNPayUrl(hashOrderId, formDataJson,{ transaction });
                return paymentUrl;
            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error paying with VNPay: ${err.message}`);
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
                await order.update({ status: OrderStatusEnum.PAID.value }, { transaction });
                return orderId;
            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error confirming VNPay success: ${err.message}`);
        }
    }

    async vnpayFailed(hashOrderId) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const orderId = parseInt(decrypt(hashOrderId));
                if(isNaN(orderId)){
                    throw new Error('Invalid order ID');
                }
                const order = await Order.findByPk(orderId);
                const paymentDetails = await paymentService.getPaymentDetailsByOrderId(orderId);
                const newOrder = await Order.create({
                    customer_id: order.customer_id,
                    total_price: order.total_price,
                    subtotal: order.subtotal,
                    amount_of_items: order.amount_of_items
                }, { transaction });
                await OrderItems.update({ order_id: newOrder.id }, { where: { order_id: orderId }, transaction });
                await shippingService.deleteShippingDetails(orderId, { transaction });
                await order.destroy({ transaction });
                console.log('VNPay failed payment handled successfully');
                return encrypt(newOrder.id.toString());
            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error handling VNPay failed payment: ${err.message}`);
        }
    }

}

module.exports = new OrderService();