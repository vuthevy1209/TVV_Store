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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 3;
            const { orders, totalPages, currentPage } = await orderService.findAllByUserId(req.user.id, page, limit);
            console.log('Orders fetched successfully');

            // Check if the request is an AJAX request (JSON response)
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.json({ orders, totalPages, currentPage });
            }

            // Render the Handlebars template for SSR
            return res.render('order/orders', { 
                orders, 
                pagination: {
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
                }
            });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: err.message });
        }
    }

    // init order --> display the order for the user to review
    //[GET] /orders/checkout
    async checkout(req, res) {
        try {
            const paymentTypes = await paymentService.findAllTypes();
            const shippingFees = await shippingService.getAllShippingFess();
            if(req.query.orderId){
                const order = orderService.fetchOrderByHashId(req.query.orderId);
                console.log('Order fetched successfully');
                return res.render('order/checkout', { order, paymentTypes, shippingFees });
            }
            const order = await orderService.checkout(req.user.id);
            console.log('Order fetched successfully');
            res.render('order/checkout', { order, paymentTypes, shippingFees });
        } catch (err) {
            console.log(err);
            req.flash('error', err.message);
            return res.redirect('/carts');
        }
    }

    //[POST] /orders/checkout/cash
    async checkoutCash(req, res) {
        try {
            const {order, shippingDetails, paymentType } = req.body;
            const hashOrderId = await orderService.confirmOrder(order, shippingDetails, paymentType);
            console.log('Order confirmed successfully');
            res.status(200).json({ redirectUrl: `/orders/confirmation?orderId=${hashOrderId}` });
        } catch (err) {
            console.log(err);
            return res.status(500).json({message: err.message, redirectUrl: '/orders'});
        }
    }

    //[POST] /orders/checkout/vnpay
    async checkoutVnpay(req, res) {
        try {
            const { order, shippingDetails, paymentType, formDataJson } = req.body;
            const paymentUrl = await orderService.payWithVNPay(order, shippingDetails, paymentType, formDataJson);
            console.log('VNPay URL created successfully');
            return res.status(200).json({ paymentUrl });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: err.message, redirectUrl: '/orders' });
        }
    }

    //[GET] /orders/vnpay/continue/:orderId
    async continueVnpayPayment(req, res) {
        try {
            const redirectUrl = await orderService.continueVnPayPayment(req.params.orderId);
            console.log('Order fetched successfully');
            res.redirect(redirectUrl);
        } catch (err) {
            console.log(err);
            req.flash('error',err.message);
            return res.redirect('/orders');
        }
    }

    //[GET] /orders/vnpay_return
    async verifyVnpayReturnUrl(req, res) {
        try {
            const vnp_Params = req.query;
            const verifiedParams = await paymentService.verifyReturnUrl(vnp_Params);
            console.log('VNPay return URL verified successfully');
            let hashOrderId = verifiedParams.vnp_TxnRef;
            if (verifiedParams.vnp_ResponseCode === '00') {
                await orderService.confirmVnPaySuccess(verifiedParams);
                return res.redirect(`/orders/confirmation?orderId=${hashOrderId}`);
            }
            console.log('Payment failed');
            await orderService.checkoutFailed(vnp_Params['vnp_TxnRef']);
            req.flash('error', 'Payment failed');
            return res.redirect("/orders");
        } catch (err) {
            console.log(err);
            req.flash('error', err.message);
            res.redirect('/orders');
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
            req.flash('error', err.message);
            return res.redirect('/orders');
        }
    }

}

module.exports = new OrderController();