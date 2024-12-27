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
            return res.status(500).json({ message: 'Internal server error while fetching orders' });
        }
    }

    // //[POST] /orders/initiate
    // async initiateOrder(req, res) {
    //     try {
    //         const orderId = await orderService.checkout(req.user.id);
    //         console.log('Initiated order successfully');
    //         res.json({ redirectUrl: `/orders/checkout?orderId=${orderId}` });
    //     } catch (err) {
    //         console.log(err);
    //         return res.status(500).json({ message: `Error initiating order: ${err.message}` });
    //     }
    // }

    //[GET] /orders/checkout
    async checkout(req, res) {
        try {
            const paymentTypes = await paymentService.findAllTypes();
            const shippingFees = await shippingService.getAllShippingFess();
            const order = await orderService.checkout(req.user.id);
            console.log('Order fetched successfully');
            console.log(order);
            res.render('order/checkout', { order, paymentTypes, shippingFees });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: `Error fetching order: ${err.message}` });
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
            return res.status(500).json({ message: `Error confirming order: ${err.message}` });
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
            return res.status(500).json({ message: `Error creating VNPay URL: ${err.message}` });
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
            else{
                hashOrderId = await orderService.vnpayFailed(verifiedParams.vnp_TxnRef);
            }
            console.log('Payment failed');
            req.flash('error', 'Payment failed');
            return res.redirect(`/orders/checkout?orderId=${hashOrderId}`);
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