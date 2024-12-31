const cron = require('node-cron');
const { Op } = require('sequelize');
const Order = require('../modules/order/models/order');
const orderEnums = require('../modules/order/enums/order.enums');
const productService = require('../modules/product/services/product.services');
const OrderItems = require('../modules/order/models/orderItem');
const { sequelize } = require('../config/database');

// Cron job to mark expired orders as failed
cron.schedule('* * * * *', async () => { // Run this every hour
    const expiredOrders = await Order.findAll({
        where: {
            status: orderEnums.OrderStatusEnum.PENDING.value,
            expired_at: {
                [Op.lte]: new Date() // Orders that have passed the expired_at time
            }
        }
    });

    return await sequelize.transaction(async (transaction) => {
        for (let order of expiredOrders) {
            try {
                // Mark the order as failed
                await order.update({ status: orderEnums.OrderStatusEnum.CANCELLED.value, expired_at: null });
                // Return the product quantity
                const orderItems = await OrderItems.findAll({
                    where: { order_id: order.id }
                });
                await Promise.all(orderItems.map(async (orderItem) => {
                    await productService.updateProductInventory(orderItem.product_id, -orderItem.quantity, { transaction });
                }));
                console.log(`Order ${order.id} has been marked as cancelled`);
            }
            catch (err) {
                console.error(`Error marking order ${order.id} as cancelled:`, err);
            }
        }
    });

});
