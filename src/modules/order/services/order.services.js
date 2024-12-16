const Order = require('../models/order');
const OrderItem = require('../models/orderItem');

const Customer = require('../../customer/models/customer');

class OrderService {

    async findAllByCustomerId(customerId) {
        try {
            const order = await Order.findOne({ where: { customer_id: customerId } });
            if (!order) {
                return [];
            }
            const orderItems = await OrderItem.findAll({ where: { order_id: order.id } });
            return orderItems;
        }
        catch (err) {
            throw err;
        }

    }

    async checkout(userId, items) {
        try {
            const customer = await Customer.findOne({ where: { user_id: userId } });
            if (!customer) {
                throw new Error('Customer not found');
            }

            let total = 0;

            const order = await Order.create({ customer_id: customer.id,total: 0 });
            for (const item of items) {
                await OrderItem.create({
                    order_id: order.id,
                    product_id: item.product_id,
                    product_price: item.price,
                    quantity: item.quantity
                });
                // TEMPORARY: Calculate total price 
                // CHANGE IF WE HAVE DISCOUNT, TAX, SHIPPING FEE, ETC...
                total += item.product_price * item.quantity;

                // remove product from cart
                //await CartItem.destroy({ where: { id: item.item_id } });
            }
            order.total = total;
            await order.save();


            return order;
        }
        catch (err) {
            throw err;
        }
    }

}

module.exports = new OrderService();