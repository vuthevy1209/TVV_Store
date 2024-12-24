const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = process.env;

class VNPayService {
    createPaymentUrl(orderId, amount, bankCode) {
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
        vnp_Params['vnp_Locale'] = 'vn';  // You can update this based on user locale
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = `Pay for order ${orderId}`;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = parseInt(amount * 100, 10);  // Convert amount to VND (in cents)
        vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = '127.0.0.1';  // Use the user's IP address here in production
        vnp_Params['vnp_CreateDate'] = moment().format('YYYYMMDDHHmmss');

        // Optional: Add BankCode if provided
        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Sort the parameters alphabetically by their names
        vnp_Params = sortObject(vnp_Params);
        const BASE_URL = process.env.NODE_ENV === 'production'
                    ? process.env.PROD_BASE_URL // Production URL
                    : process.env.DEV_BASE_URL;
        let vnpUrl = `${BASE_URL}${vnp_Url}`;
        let secretKey = vnp_HashSecret;

        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        return vnpUrl;
    }

    verifyReturnUrl(vnp_Params) {
        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sort the parameters alphabetically by their names
        vnp_Params = sortObject(vnp_Params);

        // Create the hash
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            return vnp_Params;
        } else {
            throw new Error('Invalid signature');
        }
    }
}

// Helper function to sort object properties
function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
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

module.exports = new VNPayService();
