const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');
const axios = require('axios');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = process.env;

class VNPayService {
    async createPaymentUrl(orderId, amount, bankCode, ipAddress) {
        try {
            if (!orderId || !amount || !ipAddress) {
                throw new Error('Missing required parameters: orderId, amount, or ipAddress');
            }
    
            const BASE_URL = process.env.NODE_ENV === 'production'
                ? process.env.PROD_BASE_URL
                : process.env.DEV_BASE_URL;
            const vnpReturnUrl = `${BASE_URL}${vnp_ReturnUrl}`;
    
            let userLocation = await getUserLocation(ipAddress);
            let convertedAmount;
            try {
                convertedAmount = await convertAmount(amount, userLocation.currency);
            } catch (error) {
                console.error('Error converting amount, falling back to USD:', error.message || error);
                userLocation = { country: 'United States', currency: 'USD', locale: 'us' };
                convertedAmount = amount;
            }
    
            let vnp_Params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: vnp_TmnCode,
                vnp_Locale: userLocation.locale || 'us',
                vnp_CurrCode: userLocation.currency || 'USD',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: `Pay for order ${orderId}`,
                vnp_OrderType: 'other',
                vnp_Amount: parseInt(convertedAmount * 100, 10),
                vnp_ReturnUrl: vnpReturnUrl,
                vnp_IpAddr: ipAddress,
                vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
            };
    
            if (bankCode) {
                vnp_Params['vnp_BankCode'] = bankCode;
            }
    
            vnp_Params = sortObject(vnp_Params);
            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac('sha512', vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
            vnp_Params['vnp_SecureHash'] = signed;
    
            return `${vnp_Url}?${querystring.stringify(vnp_Params, { encode: false })}`;
        } catch (error) {
            console.error('Error creating payment URL:', error.message || error);
            throw error; // Rethrow error for caller to handle
        }
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

async function getUserLocation(ipAddress) {
    try {
        const response = await axios.get(`https://get.geojs.io/v1/ip/geo/${ipAddress}.json`);
        const countryCode = response.data.country_code || 'US'; // Fallback to US if no country code
        const currency = await getCurrencyCode(countryCode);
        return {
            country: response.data.country || 'United States',
            currency: currency,
            locale: countryCode.toLowerCase(),
        };
    } catch (error) {
        console.error('Error fetching location data:', error.message || error);
        return { country: 'United States', currency: 'USD', locale: 'us' }; // Fallback location data
    }
}

async function getCurrencyCode(countryCode) {
    try {
        const response = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        if (response.data && response.data[0] && response.data[0].currencies) {
            const currencyKey = Object.keys(response.data[0].currencies)[0];
            return currencyKey;
        }
        throw new Error('Currency data not found');
    } catch (error) {
        console.error('Error fetching currency code:', error.message || error);
        return 'USD'; // Fallback currency code
    }
}

async function convertAmount(amount, currency) {
    try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`);
        const rate = response.data.rates && response.data.rates[currency];
        if (!rate) {
            console.warn(`Exchange rate for ${currency} not found, using default rate.`);
            return amount; // Fallback to original amount
        }
        return amount * rate;
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message || error);
        return amount; // Fallback to original amount
    }
}

async function getUserIpAddress() {
    try {
        const response = await axios.get('https://get.geojs.io/v1/ip.json');
        return response.data.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return '127.0.0.1'; // Fallback IP address
    }
}

module.exports = new VNPayService();
