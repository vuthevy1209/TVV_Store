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
        cart.amount_of_items = amountOfItems;
        await cart.save();

        return {products, total};

    }

    async update(customerId, productId, quantity) {
        const cart = await Cart.findOne({where: {customer_id: customerId}});
        const item = await CartItem.findOne({where: {cart_id: cart.id, product_id: productId}});
        if (item) {
            item.quantity = quantity;
            try {
                await item.save();
                
            } catch (error) {
                throw new Error('Failed to update item quantity');
            }
        } else {
            await CartItem.create({cart_id: cart.id, product_id: productId, quantity: quantity});
            cart.amount_of_items += 1;
            await cart.save();
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
            const cart = await Cart.findByPk(item.cart_id);
            cart.amount_of_items -= 1;
            await item.destroy();
            await cart.save();
        }
    }

    async deleteProducts(id) {
        const item = await CartItem.findOne({ where: { product_id: id } });
        if (!item) {
            throw new Error('Item not found');
        }
        const cart = await Cart.findByPk(item.cart_id);
        cart.amount_of_items -= 1;
        await item.destroy();
        await cart.save();
    }

    async findAmountOfItemsByCustomerId(customerId) {
        const cart = await Cart.findOne({
            where: {
                customer_id: customerId
            }
        });
        if (!cart) {
            return 0;
        }
        return cart.amount_of_items;
    }
}

module.exports = new CartService();