const PaymentDetails = require('../models/paymentDetails');
const PaymentType = require('../models/paymentType');
const VNPayDetails = require('../models/vnpayDetails');

const PaymentTypeEnums = require('../enums/payment.enums');

const VNPayService = require('./vnpay.services');
const vnpayServices = require('./vnpay.services');

const {decrypt} = require('../../../utils/encryption.utils');


class PaymentService {
    async createPayment(order, paymentType) {
        const paymentDetail = await PaymentDetails.create({
            order_id: order.id,
            payment_type_id: paymentType
        });

    }

    async createVNPayUrl(hashOrderId,formDataJson){
        const amount1 = formDataJson.amount;
        const amount2 = formDataJson['amount'];
        return vnpayServices.createPaymentUrl(hashOrderId,formDataJson.amount,formDataJson.bankCode);
    }

    async findAllTypes() {
        return await PaymentType.findAll();
    }

    async verifyReturnUrl(vnp_Params) {
        return VNPayService.verifyReturnUrl(vnp_Params);
    }

    async createVNPayDetails(orderId,vnp_Params) {
        const paymentDetails = await PaymentDetails.create({
            order_id: orderId,
            amount: vnp_Params.vnp_Amount,
            payment_type_id: PaymentTypeEnums.VNPAY,
            status: 'paid'
        });
        VNPayDetails.create({
            payment_detail_id: paymentDetails.id,
            vnp_TransactionNo: vnp_Params.vnp_TransactionNo
        });
    }

}

module.exports = new PaymentService();