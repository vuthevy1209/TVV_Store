const Cart = require('../models/cart');
const CartItem = require('../models/cartItems');
const CartMapper = require('../mapper/cartMapper');
const Product = require('../../product/models/product');

class CartService{
    async findAllByCustomerId(customerId){
        const cart = await Cart.findOne({
            where:{
                customer_id:customerId
            }
        });

        const items = await CartItem.findAll({
            where:{
                cart_id:cart.id
            }
        });

        // const products = await Promise.all(
        //     items.map(item => CartMapper.itemToProduct(item))
        // );

        const products = [];
        let total = 0;

        for (const item of items) {
            const product = await CartMapper.itemToProduct(item);
            total += product.price * product.quantity;
            products.push(product);
        }

        return {items:products, total};

    }

    async add(customerId, productId, quantity){
        const cart = await Cart.findOne({where:{customer_id:customerId}});
        const item = await CartItem.findOne({where:{cart_id:cart.id, product_id:productId}});
        if(item){
            item.quantity += quantity;
            await item.save();
            return item.get({plain:true});
        }
        else{
            return await CartItem.create({cart_id:cart.id, product_id:productId, quantity:quantity});
        }
    }

    async decreaseQuantity(id){
        const item = await CartItem.findByPk(id);
        if(!item) {
            throw new Error('Item not found');
        }
        if(item.quantity > 1){
            item.quantity -= 1;
            await item.save();
        }
        else{
            await item.destroy();
        }
    }

    async deleteProducts(id){
        const item = await CartItem.findByPk(id);
        if(!item) {
            throw new Error('Item not found');
        }
        await item.destroy();
    }
}

module.exports = new CartService();