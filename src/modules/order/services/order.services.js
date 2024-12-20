const {sequelize} = require('../../../config/database');

const Order = require('../models/order');
const OrderItem = require('../models/orderItem');

const Customer = require('../../customer/models/customer');
const cartService = require('../../cart/services/cart.services');
const customerServices = require('../../customer/services/customer.services');
const productService = require('../../product/services/product.services');
const Product = require('../../product/models/product');

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
        try{
            return await sequelize.transaction(async (transaction) => {
                const customer = await customerServices.getByUserId(userId);
                const cart = await cartService.findAllByUserId(userId);
    
                const order = await Order.create(
                    {
                        customer_id: customer.id,
                        total_price: cart.total,
                    },
                    { transaction }
                );
    
                // check before updating inventory
                const productUpdates = cart.products.map(cart_product =>
                    productService.updateProductInventory(cart_product.product.id, cart_product.product.quantity, { transaction })
                );
                await Promise.all(productUpdates);
    
                const orderItems = cart.products.map(cart_product => ({
                    order_id: order.id,
                    product_id: cart_product.product.id,
                    quantity: cart_product.product.quantity,
                    product_price: cart_product.product.price
                }));
    
                await OrderItem.bulkCreate(orderItems, { transaction });
    
            });
        }
        catch(err){
            console.log(err);
            throw new Error('Error creating order: '+err.message);
        }
        
    }

    async fetchOrderById(orderId) {
        // Fetch the complete order information with associations
        const completeOrder = await Order.findOne({
            where: { id: orderId },
            include: [
                // {
                //     model: OrderItem,
                //     as: 'orderItems',
                //     include: ['product']
                // },
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });

        // Fetch the order items
        completeOrder.dataValues.orderItems = await OrderItem.findAll({
            where: { order_id: orderId },
            include: [
                {
                    model: Product,
                    as: 'product'
                }
            ]
        });
        return completeOrder;
    }

    async fetchOrdersByCustomerId(customerId) {
        const orders = await Order.findAll({
            where: { customer_id: customerId },
            include: [
                // {
                //     model: OrderItem,
                //     as: 'orderItems',
                //     include: ['product']
                // },
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


}

module.exports = new OrderService();