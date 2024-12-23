const paymentService = require('../services/payment.services');

const {decrypt} = require('../../../utils/encryption.utils');

class PaymentController {

    // // [POST] /payments/create_payment_url
    // async createPaymentUrl(req, res) {
    //     try {
    //         const { orderId, amount, bankCode } = req.body;
    //         const paymentUrl = await paymentService.createPaymentUrl(orderId, amount, bankCode);
    //         console.log('Payment url created successfully');
    //         return res.status(200).json({ paymentUrl });
    //     } catch (err) {
    //         console.log(err);
    //         return res.status(500).json({ message: 'Internal server error while creating payment url' });
    //     }
    // }
}

module.exports = new PaymentController();