const Order = require('../modules/order/models/order'); // Ensure the correct path to the Order model
const {decrypt} = require('../utils/encryption.utils'); // Ensure the correct path to the decrypt function

const {OrderStatusEnum} = require('../modules/order/enums/order.enums');

async function confirmed(req, res, next) {

    try {
        const hashOrderId = req.params.orderId || req.body.orderId || req.query.orderId;
        if(!isNaN(hashOrderId)){
            next(); // real orderId
        }
        const orderId = parseInt(decrypt(hashOrderId));
        if (isNaN(orderId)) {
            return res.redirect('/404');
        }
        const order = await Order.findByPk(orderId);
        if (!order) {
            return res.redirect('/404');
        }

        if (order.status !== OrderStatusEnum.PENDING) { // maybe change this view to another view (confirm already error view)
            return res.redirect('/404');
        }

        next();
    } catch (error) {
        console.error('Error checking order confirmation:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { confirmed };