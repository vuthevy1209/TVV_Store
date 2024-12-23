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


const { default: Decimal } = require('decimal.js');

const { encrypt, decrypt } = require('../../../utils/encryption.utils');
const PaymentTypeEnum = require('../../payment/enums/payment.enums');
const { OrderStatusEnum } = require('../enums/order.enums');

class OrderService {

    async findAllByUserId(userId) {
        const customer = await Customer.findOne({ where: { user_id: userId } });
        if (!customer) {
            throw new Error('Customer not found');
        }
        const orders = await this.fetchOrdersByCustomerId(customer.id);
        // return plain object
        return orders.map(order => order.get({ plain: true }));
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

                const order = await Order.create({
                    customer_id: customer.id,
                    total_price: cart.total_price,
                    subtotal: cart.total_price,
                    amount_of_items: 0,
                }, { transaction });

                let subtotal = 0; // double check in case the price is updated at the time of checkout
                let amountOfItemsInOrder = 0;

                const handleItems = cartItems.map(async (cartItem) => {
                    await productService.updateProductInventory(cartItem.product_id, cartItem.quantity, { transaction });
                    await OrderItem.create({
                        order_id: order.id,
                        product_id: cartItem.product_id,
                        quantity: cartItem.quantity,
                        product_price: cartItem.product.price
                    }, { transaction });
                    subtotal += Decimal.mul(cartItem.product.price, cartItem.quantity);
                    cartItem.destroy({ transaction });
                    cart.amount_of_items--;
                    amountOfItemsInOrder += cartItem.quantity;
                    cart.total_price = Decimal.sub(cart.total_price, Decimal.mul(cartItem.product.price, cartItem.quantity));
                });

                await Promise.all(handleItems);

                await order.update({ amount_of_items: amountOfItemsInOrder, subtotal: subtotal, total_price: subtotal }, { transaction });

                await cart.update({ amount_of_items: cart.amount_of_items, total_price: cart.total_price }, { transaction });

                return encrypt(order.id.toString());

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

    async confirmOrder(hashOrderId, shippingDetails, paymentType) {
        const orderId = parseInt(decrypt(hashOrderId));
        if (isNaN(orderId)) {
            throw new Error('Invalid order ID');
        }
        const order = await Order.findByPk(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status !== OrderStatusEnum.PENDING) {
            throw new Error('Order has already been confirmed');
        }

        try {
            return await sequelize.transaction(async (transaction) => {
                await shippingService.createShipment(orderId, shippingDetails, { transaction });
                order.total_price = Decimal.add(order.total_price, shippingDetails.shipping_fee);
                await paymentService.createPayment(order, paymentType, { transaction });
                await order.update({ status: OrderStatusEnum.CONFIRMED, total_price: order.total_price }, { transaction });

            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error confirming order: ${err.message}`);
        }
    }

    async payWithVNPay(hashOrderId, shippingDetails, paymentType, formDataJson) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const orderId = parseInt(decrypt(hashOrderId));
                const order = await Order.findByPk(orderId);
                if (!order) {
                    throw new Error('Order not found');
                }
                if (order.status !== OrderStatusEnum.PENDING) {
                    console.log('Order status: ', order.status);
                    throw new Error('Order has already been confirmed');
                }
                await shippingService.createShipment(orderId, shippingDetails, { transaction });
                order.total_price = Decimal.add(order.total_price, shippingDetails.shipping_fee);
                await order.update({ total_price: order.total_price }, { transaction });
                const paymentUrl = await paymentService.createVNPayUrl(hashOrderId, formDataJson, { transaction });
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
                if (order.status !== OrderStatusEnum.PENDING) {
                    throw new Error('Order has already been confirmed');
                }
                await paymentService.createVNPayDetails(orderId, verifiedParams, { transaction });
                await order.update({ status: OrderStatusEnum.PAID }, { transaction });
                return orderId;
            });
        }
        catch (err) {
            console.log(err);
            throw new Error(`Error confirming VNPay success: ${err.message}`);
        }
    }

}

module.exports = new OrderService();