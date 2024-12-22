const PaymentDetails = require('../models/paymentDetails');
const PaymentType = require('../models/paymentType');
const VNPayDetails = require('../models/vnpayDetails');


class PaymentService {
    async createPayment(orderId, paymentType, cardDetails = null) {
        const paymentDetail = await PaymentDetails.create({
            order_id: orderId,
            payment_type_id: paymentType
        });


        if (cardDetails) {
            await VNPayDetails.create({
                payment_detail_id: paymentDetail.id,
                card_number: cardDetails.card_number,
                card_holder_name: cardDetails.card_holder_name,
                card_expiry_month: cardDetails.card_expiry_month,
                card_expiry_year: cardDetails.card_expiry_year,
                card_cvv: cardDetails.card_cvv
            });
        }

    }

    async findAllTypes() {
        return await PaymentType.findAll();
    }
}

module.exports = new PaymentService();