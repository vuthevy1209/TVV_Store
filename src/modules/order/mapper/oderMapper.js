const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Product = require('../../product/models/product');


// DEBT :  USE AutoMapperTS LATER
class OrderMapper {
    async orderItemToProduct(orderItem) {
        let result = {};

        result.quantity = orderItem.quantity;
        result.id = orderItem.product_id;

        const product = await Product.findByPk(orderItem.product_id);
        result.name = product.name;
        result.desc = product.desc;
        result.price = product.price;
        result.image_urls = product.image_urls;
        result.bussiness_status = product.bussiness_status;
        result.discount = product.discount;

        return result;
    }

}

module.exports = new OrderMapper();