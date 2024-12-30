const shippingDetails = require('../models/shippingDetails');
const shippingFees = require('../models/shippingFee');

class ShippingService{
    async createShipment(orderId,shipDetails){
        console.log(shipDetails);
        shipDetails.order_id = orderId; 
        const province = await shippingFees.findByPk(shipDetails.province);
        shipDetails.province = province.province;
        await shippingDetails.create(shipDetails);
    }

    async getAllShippingFess(){
        return await shippingFees.findAll({
            where: {
                is_deleted: false
            },
            order: [['id', 'ASC']]            
        });
    }

    async getShippingDetailsByOrderId(orderId){
        return await shippingDetails.findOne({
            where: {
                order_id: orderId
            }
        });
    }

    async deleteShippingDetails(orderId){
        await shippingDetails.destroy({
            where: {
                order_id: orderId
            }
        });
    }
}

module.exports = new ShippingService();