const Cart = require('../models/cart');
const CartItem = require('../models/cartItems');
const CartMapper = require('../mapper/cartMapper');
const productService = require('../../product/services/product.services');
const customerServices = require('../../customer/services/customer.services');

const DecimalUtils = require('../../../utils/decimal.utils');
const cartMapper = require('../mapper/cartMapper');
const Customer = require('../../customer/models/customer');
const Product = require('../../product/models/product');

class CartService {
    async findAllByUserId(userId) {
        const customer = await customerServices.getByUserId(userId);
        const cart = await this.getCartByCustomerId(customer.id);
        const items = await this.getCartItemsByCartId(cart.id);

        const { products, total, amountOfItems } = await this.#calculateCartDetails(items);

        await this.#updateCartSummary(cart, amountOfItems, total);

        return { products, total };
    }

    async findAllBySession(session) {
        const items = session.cart?.items || {};
        const { products, total,amountOfItems } = await this.#calculateSessionCartDetails(items);

        session.cart.total_price = total;
        session.cart.amount_of_items = amountOfItems;

        return { products, total, amountOfItems };
    }

    async createCart(customerId) {
        try {
            const cart = await Cart.create({ customer_id: customerId });
            return { cart };
        } catch (error) {
            console.error('Error creating cart:', error);
            throw new Error('Error creating cart');
        }
    }



    async updateMultipleItems(userId, products) {
        const customer = await customerServices.getByUserId(userId);
        const cart = await this.getCartByCustomerId(customer.id);

        const { cartTotalPrice, cartAmountOfItems, newItemsTotalPrice } = await this.#updateCartItems(cart, products);

        await this.#updateCartSummary(cart, cartAmountOfItems, cartTotalPrice);

        return {newItemsTotalPrice, cartTotalPrice, cartAmountOfItems };
    }

    async updateMultipleItemsInSession(session, products) {
        session.cart = session.cart || { amount_of_items: 0, total_price: 0, items: {} };

        const { cartTotalPrice, cartAmountOfItems, newItemsTotalPrice } = await this.#updateSessionCartItems(session.cart, products);

        session.cart.total_price = cartTotalPrice;
        session.cart.amount_of_items = cartAmountOfItems;

        return {newItemsTotalPrice, cartTotalPrice, cartAmountOfItems };
    }

    async findAmountOfItemsByCustomerId(userId) {
        const customer = await customerServices.getByUserId(userId);
        const cart = await this.getCartByCustomerId(customer.id);
        return cart?.amount_of_items || 0;
    }

    async mergeCarts(userId, cartData) {
        if (!cartData || cartData.length === 0) return;
        await this.updateMultipleItems(userId, cartData);
    }

    async findAmountOfItemsBySession(session) {
        return session.cart?.amount_of_items || 0;
    }

    async getCartByCustomerId(customerId) {
        const cart = Cart.findOne({ 
            where: { customer_id: customerId },
        });
            
        if (!cart) throw new Error('Cart not found');
        return cart;
    }

    async getCartItemsByCartId(cartId) {
        const items = await CartItem.findAll({
            where: { cart_id: cartId },
            include:[
                {model: Product, as: 'product'}
            ]
        });
        return items;
    }

    async #updateCartSummary(cart, amountOfItems, totalPrice) {
        cart.amount_of_items = amountOfItems;
        cart.total_price = totalPrice;
        await cart.save();
    }

    async #calculateCartDetails(items) {
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

        return { products, total, amountOfItems };
    }

    async #calculateSessionCartDetails(items) {
        const products = [];
        let total = 0;
        let amountOfItems = 0;

        for (const productId in items) {
            const product = await cartMapper.itemToProduct({ product_id: productId, quantity: items[productId] });
            if (!product) throw new Error('Product not found');

            const currPrice = product.price * items[productId];
            total += currPrice;
            products.push({ product, currPrice });
            amountOfItems++;
        }

        return { products, total, amountOfItems };
    }

    async #updateCartItems(cart, products) {
        let cartTotalPrice = DecimalUtils.toDecimal(cart.total_price);
        let cartAmountOfItems = cart.amount_of_items;
        const newItemsTotalPrice = {};

        for (const productId in products) {
            const quantity = products[productId];
            const item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
            const product = await productService.findById(productId);

            if (!product) throw new Error('Product not found');

            if (quantity > product.inventory_quantity) throw new Error('Quantity exceeds inventory');

            const productPrice = DecimalUtils.toDecimal(product.price);
            const newItemTotalPrice = quantity * productPrice;

            if (item) {
                cartTotalPrice = DecimalUtils.subtract(cartTotalPrice, item.quantity * productPrice);
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);

                if (quantity > 0) {
                    item.quantity = quantity;
                    await item.save();
                } else {
                    cartAmountOfItems--;
                    await item.destroy();
                }
            } else {
                await CartItem.create({ cart_id: cart.id, product_id: productId, quantity });
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);
                cartAmountOfItems++;
            }

            newItemsTotalPrice[productId] = newItemTotalPrice;
        }

        return { cartTotalPrice, cartAmountOfItems, newItemsTotalPrice };
    }

    async #updateSessionCartItems(cart, products) {
        let cartTotalPrice = DecimalUtils.toDecimal(cart.total_price);
        let cartAmountOfItems = cart.amount_of_items;
        const newItemsTotalPrice = {};

        for (const productId in products) {
            const quantity = products[productId];
            const product = await productService.findById(productId);

            if (!product) throw new Error('Product not found');
            if (quantity > product.inventory_quantity) throw new Error('Quantity exceeds inventory');

            const productPrice = DecimalUtils.toDecimal(product.price);
            const newItemTotalPrice = quantity * productPrice;

            if (cart.items[productId]) {
                const oldQuantity = cart.items[productId];
                cartTotalPrice = DecimalUtils.subtract(cartTotalPrice, oldQuantity * productPrice);
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);

                if (quantity > 0) {
                    cart.items[productId] = quantity;
                } else {
                    cartAmountOfItems--;
                    delete cart.items[productId];
                }
            } else {
                cart.items[productId] = quantity;
                cartAmountOfItems++;
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);
            }

            newItemsTotalPrice[productId] = newItemTotalPrice;
        }

        return { cartTotalPrice, cartAmountOfItems, newItemsTotalPrice };
    }
}

module.exports = new CartService();
