const shippingDetails = require('../models/shippingDetails');
const shippingFees = require('../models/shippingFee');

class ShippingService{
    async createShipment(orderId,shipDetails){
        shippingDetails.order_id = orderId; 
        await shippingDetails.create(shipDetails);
    }

    async getAllShippingFess(){
        return await shippingFees.findAll();
    }
}

module.exports = new ShippingService();