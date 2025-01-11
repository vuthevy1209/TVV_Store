const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');
const axios = require('axios');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = process.env;


class VNPayService {
    async createPaymentUrl(orderId, amount, bankCode, ipAddress) {
        try {
            // Determine base URL
            const BASE_URL = process.env.NODE_ENV === 'production'
                ? process.env.PROD_BASE_URL
                : process.env.DEV_BASE_URL;
            const vnpReturnUrl = `${BASE_URL}${vnp_ReturnUrl}`;

            // Convert amount to VND (assuming input is in USD)
            const convertedAmount = await this.convertAmountToVND(amount);
            const amountInCents = Math.round(convertedAmount * 100); // Convert to smallest VND unit (cents)

            // Build VNPay parameters
            const vnp_Params = this.buildVnpParams(orderId, amountInCents, bankCode,ipAddress, vnpReturnUrl);

            // Generate secure hash
            vnp_Params['vnp_SecureHash'] = this.generateSecureHash(vnp_Params);

            // Return the payment URL
            return `${vnp_Url}?${querystring.stringify(vnp_Params, { encode: false })}`;
        } catch (error) {
            console.error('Error creating payment URL:', error.message || error);
            throw error; // Propagate error to caller
        }
    }

    verifyReturnUrl(vnp_Params) {
        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        const sortedParams = this.sortObject(vnp_Params);
        const signedHash = this.generateSecureHash(sortedParams);

        if (secureHash === signedHash) {
            return vnp_Params;
        } else {
            throw new Error('Invalid signature');
        }
    }

    async convertAmountToVND(amount) {
        try {
            const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
            const rateToVND = response.data.rates['VND'];
            if (!rateToVND) throw new Error('Exchange rate for VND not found');
            return amount * rateToVND;
        } catch (error) {
            console.error('Error fetching exchange rate:', error.message || error);
            return amount; // Fallback to original amount if conversion fails
        }
    }

    buildVnpParams(orderId, amount, bankCode,ipAddress, returnUrl) {
        const vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnp_TmnCode,
            vnp_Locale: 'vn', // Default to 'vn' for VND
            vnp_CurrCode: 'VND', // VNPay only supports VND
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Pay for order ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amount,
            vnp_ReturnUrl: returnUrl,
            vnp_IpAddr: ipAddress || '8.8.8.8', // Fallback IP address
            vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
        };

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        return this.sortObject(vnp_Params);
    }

    generateSecureHash(params) {
        const signData = querystring.stringify(params, { encode: false });
        return crypto.createHmac('sha512', vnp_HashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
    }

    // Helper function to sort object properties
    sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

}

module.exports = new VNPayService();
