const cron = require('node-cron');
const { Op } = require('sequelize');
const Order = require('../modules/order/models/order');
const orderEnums = require('../modules/order/enums/order.enums');

// Cron job to mark expired orders as failed
cron.schedule('* * * * *', async () => { // Run this every hour
    try {
        const expiredOrders = await Order.findAll({
            where: {
                status: orderEnums.OrderStatusEnum.PENDING.value,
                expired_at: {
                    [Op.lte]: new Date() // Orders that have passed the expired_at time
                }
            }
        });

        for (let order of expiredOrders) {
            // Mark the order as failed
            await order.update({ status: orderEnums.OrderStatusEnum.CANCELLED.value, expired_at: null });
            console.log(`Order ${order.id} has been marked as failed`);
        }
    } catch (err) {
        console.error('Error marking expired orders as failed:', err);
    }
});
