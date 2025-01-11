const { sequelize } = require('../../../config/database');
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Customer = require('../../customer/models/customer');
const Cart = require('../../cart/models/cart');
const CartItem = require('../../cart/models/cartItems');
const Product = require('../../product/models/product');
const OrderItems = require('../models/orderItem');
const cartService = require('../../cart/services/cart.services');
const customerServices = require('../../customer/services/customer.services');
const productService = require('../../product/services/product.services');
const shippingService = require('../../shipping/services/shipping.services');
const paymentService = require('../../payment/services/payment.services');
const { default: Decimal } = require('decimal.js');
const { encrypt, decrypt } = require('../../../utils/encryption.utils');
const PaymentTypeEnum = require('../../payment/enums/payment.enums');
const { OrderStatusEnum } = require('../enums/order.enums');
const moment = require('moment');

class OrderService {
    async findAllByUserId(userId, page = 1, limit = 10) {
        const customer = await this.getCustomerByUserId(userId);
        const { rows: orders, count } = await Order.findAndCountAll({
            where: { customer_id: customer.id, is_deleted: false },
            limit,
            offset: (page - 1) * limit,
            order: [['created_at', 'DESC']],
        });

        await Promise.all(orders.map(async (order) => {
            order.dataValues.orderItems = await this.getOrderItems(order.id);
            order.dataValues.paymentDetails = await this.getPaymentDetails(order.id);
        }));

        return {
            orders: orders.map((order) => this.formatOrder(order)),
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        };
    }

    async findAllByUserIdWithPagination(userId, page = 1, limit = 10) {
        const { orders, totalPages, currentPage } = await this.findAllByUserId(userId, page, limit);
        const pagination = {
            currentPage,
            totalPages,
            hasPrev: currentPage > 1,
            hasNext: currentPage < totalPages,
            prevPage: currentPage - 1,
            nextPage: currentPage + 1,
            pages: Array.from({ length: totalPages }, (_, i) => ({
                number: i + 1,
                active: i + 1 === currentPage
            }))
        };
        return { orders, pagination };
    }

    async checkout(userId) {
        return sequelize.transaction(async (transaction) => {
            const customer = await customerServices.getByUserId(userId);
            const cart = await cartService.getCartByCustomerId(customer.id);
            if (!cart || cart.amount_of_items === 0) throw new Error('Cart is empty');

            const cartItems = await cartService.getCartItemsByCartId(cart.id);
            const { orderItems, subtotal, amountOfItemsInOrder } = await this.processCartItems(cartItems);

            return {
                customer_id: customer.id,
                amount_of_items: amountOfItemsInOrder,
                subtotal: subtotal,
                total_price: subtotal,
                orderItems,
            };
        });
    }

    async fetchOrderById(orderId) {
        const order = await Order.findOne({
            where: { id: orderId, is_deleted: false },
            include: [{ model: Customer, as: 'customer', where: { is_deleted: false } }],
        });
        if (!order) throw new Error('Order not found');

        order.dataValues.orderItems = await this.getOrderItems(orderId);
        order.dataValues.paymentDetails = await this.getPaymentDetails(orderId);

        return order.get({ plain: true });
    }

    async fetchOrderByHashId(hashOrderId) {
        const orderId = parseInt(decrypt(hashOrderId));
        if (isNaN(orderId)) throw new Error('Invalid order ID');

        const order = await this.fetchOrderById(orderId);
        order.hashOrderId = hashOrderId;
        return order;
    }

    async confirmOrder(order, shippingDetails, paymentType) {
        return sequelize.transaction(async (transaction) => {
            const newOrder = await this.createOrder(order, shippingDetails, OrderStatusEnum.CONFIRMED.value, transaction);
            const cart = await cartService.getCartByCustomerId(order.customer_id);

            await this.processOrderItems(order.orderItems, newOrder.id, cart, transaction);

            await cart.update({ amount_of_items: cart.amount_of_items, total_price: cart.total_price }, { transaction });
            await shippingService.createShipment(newOrder.id, shippingDetails, { transaction });
            await paymentService.createPayment(newOrder, paymentType, { transaction });

            return encrypt(newOrder.id.toString());
        });
    }

    async payWithVNPay(order, shippingDetails, paymentType, formDataJson) {
        return sequelize.transaction(async (transaction) => {
            formDataJson.amount = Decimal.add(order.total_price, shippingDetails.shipping_fee).toNumber();

            const newOrder = await this.createOrder(order, shippingDetails, OrderStatusEnum.PENDING.value, transaction);
            const cart = await cartService.getCartByCustomerId(order.customer_id);

            await this.processOrderItems(order.orderItems, newOrder.id, cart, transaction);

            await cart.update({ amount_of_items: cart.amount_of_items, total_price: cart.total_price }, { transaction });
            await shippingService.createShipment(newOrder.id, shippingDetails, { transaction });

            const hashedOrderId = encrypt(newOrder.id.toString());
            const paymentUrl = await paymentService.createVNPayUrl(hashedOrderId, formDataJson, { transaction });

            return paymentUrl;
        });
    }

    async confirmVnPaySuccess(verifiedParams) {
        return sequelize.transaction(async (transaction) => {
            const hashOrderId = verifiedParams['vnp_TxnRef'];
            const orderId = parseInt(decrypt(hashOrderId));
            const order = await Order.findByPk(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== OrderStatusEnum.PENDING.value) throw new Error('Order has already been confirmed');

            await paymentService.createVNPayDetails(orderId, verifiedParams, { transaction });
            await order.update({ status: OrderStatusEnum.PAID.value, expired_at: null }, { transaction });

            return orderId;
        });
    }

    async continueVnPayPayment(hashOrderId) {
        const order = await this.fetchOrderByHashId(hashOrderId);
        if (!order) throw new Error('Order not found');
        if (order.status !== OrderStatusEnum.PENDING.value) throw new Error('Order has already been confirmed');

        const payData = {
            amount: order.total_price,
            bankCode: '',
        };
        return paymentService.createVNPayUrl(hashOrderId, payData);
    }

    async checkoutFailed(hashOrderId) {
        return sequelize.transaction(async (transaction) => {
            const orderId = parseInt(decrypt(hashOrderId));
            const order = await Order.findByPk(orderId);
            if (!order) throw new Error('Order not found');
            if (order.status !== OrderStatusEnum.PENDING.value) throw new Error('Order has already been processed');

            await order.update({ status: OrderStatusEnum.CANCELLED.value, expired_at: null }, { transaction });

            const orderItems = await OrderItems.findAll({ where: { order_id: orderId }, transaction });
            await Promise.all(orderItems.map((item) =>
                productService.updateProductInventory(item.product_id, -item.quantity, { transaction })
            ));
        });
    }

    // ---------------------------- Helper functions ----------------------------
    
    async getCustomerByUserId(userId) {
        const customer = await Customer.findOne({ where: { user_id: userId, is_deleted: false } });
        if (!customer) throw new Error('Customer not found');
        return customer;
    }

    async getOrderItems(orderId) {
        return OrderItem.findAll({
            where: { order_id: orderId },
            include: [{ model: Product, as: 'product', where: { business_status: false } }],
        });
    }

    async getPaymentDetails(orderId) {
        const paymentDetails = await paymentService.getPaymentDetailsByOrderId(orderId);
        return paymentDetails ? paymentDetails.get({ plain: true }) : null;
    }

    formatOrder(order) {
        const plainOrder = order.get({ plain: true });
        plainOrder.hashOrderId = encrypt(order.id.toString());
        plainOrder.statusName = OrderStatusEnum.properties[order.status].name;
        plainOrder.created_at = moment(order.created_at).format('MMMM Do YYYY, h:mm:ss a');
        return plainOrder;
    }

    async processCartItems(cartItems) {
        const orderItems = [];
        let subtotal = 0;
        let amountOfItemsInOrder = 0;

        await Promise.all(cartItems.map(async (cartItem) => {
            if (cartItem.product.business_status !== false) throw new Error('Product is not available');
            orderItems.push({
                product: {
                    id: cartItem.product.id,
                    name: cartItem.product.name,
                    image: cartItem.product.image_urls,
                },
                quantity: cartItem.quantity,
                product_price: cartItem.product.price,
                product_id: cartItem.product.id,
                cart_item_id: cartItem.id,
            });
            subtotal = Decimal.add(subtotal, Decimal.mul(cartItem.product.price, cartItem.quantity));
            amountOfItemsInOrder += cartItem.quantity;
        }));

        return { orderItems, subtotal, amountOfItemsInOrder };
    }

    async processOrderItems(orderItems, orderId, cart, transaction) {
        await Promise.all(orderItems.map(async (item) => {
            await OrderItems.create(
                {
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    product_price: item.product_price,
                },
                { transaction }
            );
            await productService.updateProductInventory(item.product_id, item.quantity, { transaction });

            const cartItem = await CartItem.findByPk(item.cart_item_id);
            if (cartItem.quantity === item.quantity) {
                await cartItem.destroy({ transaction });
                cart.amount_of_items--;
            } else {
                await cartItem.update({ quantity: cartItem.quantity - item.quantity }, { transaction });
            }
            cart.total_price = Decimal.sub(cart.total_price, Decimal.mul(item.product_price, item.quantity));
        }));
    }

    async createOrder(order, shippingDetails, status, transaction) {
        return Order.create(
            {
                customer_id: order.customer_id,
                total_price: Decimal.add(order.total_price, shippingDetails.shipping_fee),
                subtotal: order.subtotal,
                amount_of_items: order.amount_of_items,
                status: status,
            },
            { transaction }
        );
    }
}

module.exports = new OrderService();
