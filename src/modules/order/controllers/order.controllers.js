const orderService = require('../services/order.services');
const paymentService = require('../../payment/services/payment.services');
const shippingService = require('../../shipping/services/shipping.services');
const { decrypt } = require('../../../utils/encryption.utils');
const { OrderStatusEnum } = require('../enums/order.enums');
const Order = require('../models/order');

class OrderController {

    //[GET] /orders
    async index(req, res) {
        try {
            const orders = await orderService.findAllByUserId(req.user.id);
            console.log('Orders fetched successfully');
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
    async checkout(req, res) {
        try {
            const hashOrderId = req.query.orderId;
            const order = await orderService.fetchOrderByHashId(hashOrderId);
            const paymentTypes = await paymentService.findAllTypes();
            const shippingFees = await shippingService.getAllShippingFess();
            // check if is navigaged by vnpay because of failed payment --> delete shipping details and update total price
            if (order.status === OrderStatusEnum.PENDING){
                await shippingService.deleteShippingDetails(order.id);
                await Order.update({totalPrice: order.subtotal}, {where: {id: order.id}});
            };
            console.log('Order fetched successfully');
            res.render('order/checkout', { order, paymentTypes, shippingFees });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error fetching order: ${err.message}` });
        }
    }

    //[POST] /orders/checkout/cash/:orderId
    async checkoutCash(req, res) {
        try {
            const hashOrderId = req.params.orderId;
            const { shippingDetails, paymentType } = req.body;
            await orderService.confirmOrder(hashOrderId, shippingDetails, paymentType);
            console.log('Order confirmed successfully');
            res.status(200).json({ redirectUrl: `/orders/confirmation?orderId=${hashOrderId}` });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error confirming order: ${err.message}` });
        }
    }

    //[POST] /orders/checkout/vnpay
    async checkoutVnpay(req, res) {
        try {
            const { orderId, shippingDetails, paymentType, formDataJson } = req.body;
            const paymentUrl = await orderService.payWithVNPay(orderId, shippingDetails, paymentType, formDataJson);
            console.log('VNPay URL created successfully');
            return res.status(200).json({ paymentUrl });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error creating VNPay URL: ${err.message}` });
        }
    }

    //[GET] /orders/vnpay_return
    async verifyVnpayReturnUrl(req, res) {
        try {
            const vnp_Params = req.query;
            const order = await orderService.fetchOrderByHashId(vnp_Params.vnp_TxnRef);
            const verifiedParams = await paymentService.verifyReturnUrl(vnp_Params);
            console.log('VNPay return URL verified successfully');
            if (verifiedParams.vnp_ResponseCode === '00') {
                const orderId = orderService.confirmVnPaySuccess(verifiedParams);
                return res.redirect(`/orders/confirmation?orderId=${order.hashOrderId}`);
            }
            req.flash('error', 'Payment failed');
            return res.redirect(`/orders/checkout?orderId=${order.hashOrderId}`);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error verifying VNPay return URL: ${err.message}` });
        }
    }

    // [GET] /orders/confirmation
    async orderConfirmation(req, res) {
        try {
            const orderId = req.query.orderId;
            const order = await orderService.fetchOrderByHashId(orderId);
            const shippingDetails = await shippingService.getShippingDetailsByOrderId(order.id);
            console.log('Order fetched successfully');
            res.render('order/confirmation', { order, shippingDetails });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error fetching order: ${err.message}` });
        }
    }

}

module.exports = new OrderController();