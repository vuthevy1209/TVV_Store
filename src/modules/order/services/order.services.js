const {sequelize} = require('../../../config/database');

const Order = require('../models/order');
const OrderItem = require('../models/orderItem');

const Customer = require('../../customer/models/customer');
const cartService = require('../../cart/services/cart.services');
const customerServices = require('../../customer/services/customer.services');
const productService = require('../../product/services/product.services');
const Product = require('../../product/models/product');
const Cart = require('../../cart/models/cart');
const { default: Decimal } = require('decimal.js');

const {encrypt,decrypt} = require('../../../utils/encryption.utils');

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

    async checkout(userId){
        try{
            return await sequelize.transaction(async(transaction)=>{
                const customer = await customerServices.getByUserId(userId);
                const cart = await cartService.getCartByCustomerId(customer.id);
                if(!cart || cart.amount_of_items === 0){
                    throw new Error('Cart is empty');
                }
                const cartItems = await cartService.getCartItemsByCartId(cart.id);
                
                const order = await Order.create({
                    customer_id: customer.id,
                    total_price: cart.total_price
                },{transaction});

                let total_price = 0; // double check in case the price is updated at the time of checkout

                const handleItems = cartItems.map(async(cartItem)=>{
                    await productService.updateProductInventory(cartItem.product_id, cartItem.quantity, {transaction});
                    await OrderItem.create({
                        order_id: order.id,
                        product_id: cartItem.product_id,
                        quantity: cartItem.quantity,
                        product_price: cartItem.product.price
                    },{transaction});
                    total_price = Decimal.add(total_price, Decimal.mul(cartItem.product.price, cartItem.quantity));
                    cartItem.destroy({transaction});
                    cart.amount_of_items --;
                    cart.total_price = Decimal.sub(cart.total_price, Decimal.mul(cartItem.product.price, cartItem.quantity));
                });

                await Promise.all(handleItems);

                await order.update({total_price}, {transaction});

                await cart.update({amount_of_items: cart.amount_of_items, total_price: cart.total_price}, {transaction});

                return encrypt(order.id.toString());
                
            });
        }
        catch(err){
            console.log(err);
            throw new Error('Error creating order: '+err.message);
        }
    }

    async fetchOrderById(hashOrderId) {
        const orderId = parseInt(decrypt(hashOrderId));
        if (isNaN(orderId)) {
            throw new Error('Invalid order ID');
        }
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


}

module.exports = new OrderService();