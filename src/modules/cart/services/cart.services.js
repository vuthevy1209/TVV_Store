const Cart = require('../models/cart');
const CartItem = require('../models/cartItems');
const CartMapper = require('../mapper/cartMapper');
const Product = require('../../product/models/product');

const DecimalUtils = require('../../../utils/decimal.utils');

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
            products.push({ product, currPrice });
        }
        cart.amount_of_items = amountOfItems;
        cart.total_price = total;
        await cart.save();

        return { products, total };
    }

    async createCart(customerId) {
        try {
            const cart = await Cart.create({ customer_id: customerId });
            return { cart };
        } catch (error) {
            console.error('Error creating cart:', error);
            return { error: 'An error occurred while creating cart' };
        }
    }

    async updateProductInventory(product,newQuantity,oldQuantity) {
        product.inventory_quantity = product.inventory_quantity - newQuantity + oldQuantity;
        await product.save();
    }

    async updateMultipleItems(customerId, products) {

        const cart = await Cart.findOne({ where: { customer_id: customerId } });
        let cartTotalPrice = DecimalUtils.toDecimal(cart.total_price);
        let newItemsTotalPrice = {};

        for (const productId in products) {
            const quantity = products[productId];
            const item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
            const product = await Product.findByPk(productId);

            if (!product) {
                throw new Error('Product not found');
            }

            if (quantity > product.inventory_quantity) {
                throw new Error('Quantity exceeds inventory');
            }

            const productPrice = DecimalUtils.toDecimal(product.price);
            let newItemTotalPrice = quantity * productPrice;

            if (item) {
                cartTotalPrice = DecimalUtils.subtract(cartTotalPrice, item.quantity * productPrice);
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);
                if (quantity > 0) {
                    this.updateProductInventory(product,quantity,item.quantity);
                    item.quantity = quantity;
                    await item.save();
                } else {
                    cart.amount_of_items -= 1;
                    this.updateProductInventory(product,0,item.quantity);
                    await item.destroy();
                }
            } else {
                
                await CartItem.create({ cart_id: cart.id, product_id: productId, quantity: quantity });
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);
                cart.amount_of_items += 1;
            }
            newItemsTotalPrice[productId] = newItemTotalPrice;
        }

        cart.total_price = cartTotalPrice;
        await cart.save();

        return { newItemsTotalPrice, cartTotalPrice };

    }

    async decreaseQuantity(id) { // decrease 1 unit
        const item = await CartItem.findByPk(id);
        if (!item) {
            throw new Error('Item not found');
        }
        const cart = await Cart.findByPk(item.cart_id);
        cart.total_price -= (await Product.findByPk(item.product_id)).price;
        if (item.quantity > 1) {
            item.quantity -= 1;
            await item.save();
        } else {
            cart.amount_of_items -= 1;
            await item.destroy();
        }
        await cart.save();
    }

    async deleteProducts(id) {
        const item = await CartItem.findOne({ where: { product_id: id } });
        if (!item) {
            throw new Error('Item not found');
        }
        const cart = await Cart.findByPk(item.cart_id);
        cart.amount_of_items -= 1;

        cart.total_price = DecimalUtils.subtract(cart.total_price, (await Product.findByPk(id)).price)

        await item.destroy();
        await cart.save();
        return { cartTotalPrice: cart.total_price };
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

    // async findTotalPriceByCustomerId(customerId) {
    //     const cart = await Cart.findOne({
    //         where: {
    //             customer_id: customerId
    //         }
    //     });
    //     if (!cart) {
    //         return 0;
    //     }
    //     return cart.total_price;
    // }
}

module.exports = new CartService();