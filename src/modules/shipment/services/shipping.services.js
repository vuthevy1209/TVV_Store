const shippingDetails = require('../models/shippingDetails');

class ShippingService{
    async createShipment(orderId,shipDetails){
        shippingDetails.order_id = orderId; 
        await shippingDetails.create(shipDetails);
    }
}

module.exports = new ShippingService();