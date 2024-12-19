const Cart = require('../models/cart');
const CartItem = require('../models/cartItems');
const CartMapper = require('../mapper/cartMapper');
const Product = require('../../product/models/product');

const DecimalUtils = require('../../../utils/decimal.utils');
const customerServices = require('../../customer/services/customer.services');
const cartMapper = require('../mapper/cartMapper');

class CartService {
    async findAllByCustomerId(userId) {
        const customer = await this.#getCustomerByUserId(userId);
        const cart = await this.#getCartByCustomerId(customer.id);
        const items = await this.#getCartItems(cart.id);

        const { products, total, amountOfItems } = await this.#calculateCartDetails(items);

        await this.#updateCartSummary(cart, amountOfItems, total);

        return { products, total };
    }

    async findAllBySession(session) {
        const items = session.cart?.items || {};
        const { products, total } = await this.#calculateSessionCartDetails(items);

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

    async updateProductInventory(product, newQuantity, oldQuantity) {
        product.inventory_quantity += oldQuantity - newQuantity;
        await product.save();
    }

    async updateMultipleItems(userId, products) {
        const customer = await this.#getCustomerByUserId(userId);
        const cart = await this.#getCartByCustomerId(customer.id);

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
        const customer = await this.#getCustomerByUserId(userId);
        const cart = await this.#getCartByCustomerId(customer.id);
        return cart?.amount_of_items || 0;
    }

    async mergeCarts(userId, cartData) {
        if (!cartData || cartData.length === 0) return;
        await this.updateMultipleItems(userId, cartData);
    }

    async findAmountOfItemsBySession(session) {
        return session.cart?.amount_of_items || 0;
    }

    // Private utility methods

    async #getCustomerByUserId(userId) {
        const customer = await customerServices.getByUserId(userId);
        if (!customer) {
            console.log('User id', userId);
            throw new Error('Customer not found');
        }
        return customer;
    }

    async #getCartByCustomerId(customerId) {
        const cart = await Cart.findOne({ where: { customer_id: customerId } });
        if (!cart) throw new Error('Cart not found');
        return cart;
    }

    async #getCartItems(cartId) {
        return CartItem.findAll({ where: { cart_id: cartId } });
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

        for (const productId in items) {
            const product = await cartMapper.itemToProduct({ product_id: productId, quantity: items[productId] });
            if (!product) throw new Error('Product not found');

            const currPrice = product.price * items[productId];
            total += currPrice;
            products.push({ product, currPrice });
        }

        return { products, total };
    }

    async #updateCartItems(cart, products) {
        let cartTotalPrice = DecimalUtils.toDecimal(cart.total_price);
        let cartAmountOfItems = cart.amount_of_items;
        const newItemsTotalPrice = {};

        for (const productId in products) {
            const quantity = products[productId];
            const item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
            const product = await Product.findByPk(productId);

            if (!product) throw new Error('Product not found');
            if (quantity > product.inventory_quantity) throw new Error('Quantity exceeds inventory');

            const productPrice = DecimalUtils.toDecimal(product.price);
            const newItemTotalPrice = quantity * productPrice;

            if (item) {
                cartTotalPrice = DecimalUtils.subtract(cartTotalPrice, item.quantity * productPrice);
                cartTotalPrice = DecimalUtils.add(cartTotalPrice, newItemTotalPrice);

                if (quantity > 0) {
                    await this.updateProductInventory(product, quantity, item.quantity);
                    item.quantity = quantity;
                    await item.save();
                } else {
                    cartAmountOfItems--;
                    await this.updateProductInventory(product, 0, item.quantity);
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
            const product = await Product.findByPk(productId);

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
