const orderService = require('../services/order.services');
const paymentService = require('../../payment/services/payment.services');
const shippingService = require('../../shipping/services/shipping.services');

class OrderController {

    //[GET] /orders
    async index(req, res) {
        try {
            const orders = await orderService.findAllByUserId(req.user.id);
            console.log('Orders fetched successfully');
            console.log(orders);
            //res.render('order/checkout', {orders}); HAVEN'T CREATED THIS VIEW YET
            return res.status(200).json(orders);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error while fetching orders' });
        }
    }

    //[POST] /orders/initiate
    async initiateOrder(req, res) {
        try {
            const orderId = await orderService.checkout(req.user.id);
            console.log('Initiated order successfully');
            res.json({ redirectUrl: `/orders/checkout?orderId=${orderId}` });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error initiating order: ${err.message}` });
        }
    }

    //[GET] /orders/checkout
    async checkoutSuccess(req, res) {
        try {
            const hashOrderId = req.query.orderId;
            const order = await orderService.fetchOrderById(hashOrderId);
            order.hashOrderId = hashOrderId;
            const paymentTypes = await paymentService.findAllTypes();
            const shippingFees = await shippingService.getAllShippingFess();
            console.log('Order fetched successfully');
            res.render('order/checkout', { order, paymentTypes, shippingFees });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error fetching order: ${err.message}` });
        }
    }

    //[POST] /orders/checkout/confirm/:orderId
    async confirmOrder(req, res) {
        try {
            const hashOrderId = req.params.orderId;
            const { shippingDetails, paymentType, cardDetails } = req.body;
            await orderService.confirmOrder(hashOrderId, shippingDetails, paymentType, cardDetails);
            console.log('Order confirmed successfully');
            res.redirect('/orders');
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error confirming order: ${err.message}` });
        }
    }

}

module.exports = new OrderController();