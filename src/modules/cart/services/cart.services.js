const Cart = require('../models/cart');
const CartItem = require('../models/cartItems');
const CartMapper = require('../mapper/cartMapper');
const Product = require('../../product/models/product');

class CartService {
    async findAllByCustomerId(customerId) {
        const cart = await Cart.findOne({
            where: {
                customer_id: customerId
            }
        });

        const items = await CartItem.findAll({
            where: {
                cart_id: cart.id
            }
        });


        const products = [];
        let total = 0;
        let amountOfItems = 0;

        for (const item of items) {
            const product = await CartMapper.itemToProduct(item);
            const currPrice = product.price * product.quantity;
            total += currPrice;
            amountOfItems++;
            products.push({product, currPrice});
        }

        return {products, total, amountOfItems};

    }

    async add(customerId, productId, quantity) {
        const cart = await Cart.findOne({where: {customer_id: customerId}});
        const item = await CartItem.findOne({where: {cart_id: cart.id, product_id: productId}});
        if (item) {
            item.quantity = quantity;
            try {
                await item.save();
                const res =  item.get({plain: true});
                console.log(res.quantity);
            } catch (error) {
                console.error('Error saving item:', error);
                throw new Error('Failed to update item quantity');
            }
        } else {
            return await CartItem.create({cart_id: cart.id, product_id: productId, quantity: quantity});
        }
    }

    async decreaseQuantity(id) {
        const item = await CartItem.findByPk(id);
        if (!item) {
            throw new Error('Item not found');
        }
        if (item.quantity > 1) {
            item.quantity -= 1;
            await item.save();
        } else {
            await item.destroy();
        }
    }

    async deleteProducts(id) {
        const item = await CartItem.findOne({ where: { product_id: id } });
        if (!item) {
            throw new Error('Item not found');
        }
        await item.destroy();
    }
}

module.exports = new CartService();