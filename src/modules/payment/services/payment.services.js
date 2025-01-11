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
        
        return await vnpayServices.createPaymentUrl(hashOrderId,formDataJson.amount,formDataJson.bankCode, formDataJson.ipAddress);
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
        await VNPayDetails.create({
            payment_detail_id: paymentDetails.id,
            vnp_TransactionNo: vnp_Params.vnp_TransactionNo
        });
    }

    async getPaymentDetailsByOrderId(orderId) {
        return PaymentDetails.findOne({
            where: {
                order_id: orderId
            }
        });
    }    

    async deletePaymentDetailsByOrderId(orderId) {
        
        return PaymentDetails.destroy({
            where: {
                order_id: orderId
            }
        });
    }

    

}

module.exports = new PaymentService();