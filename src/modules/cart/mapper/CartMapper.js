const Product = require('../../product/models/product');

// DEBT :  USE AutoMapperTS LATER
class CartMapper {
    
    async itemToProduct(item) {
        let result = {};

        result.quantity = item.quantity;
        result.product_id = item.product_id;

        const product = await Product.findByPk(item.product_id);
        result.name = product.name;
        result.desc = product.desc;
        result.price = product.price;
        result.image_urls = product.image_urls;
        result.bussiness_status = product.bussiness_status;
        result.discount = product.discount;

        return result;

    }
}

module.exports = new CartMapper();