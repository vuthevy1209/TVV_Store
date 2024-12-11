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
            products.push({product, currPrice});
        }
        cart.amount_of_items = amountOfItems;
        cart.total_price = total;
        await cart.save();

        return {products, total};

    }

    async update(customerId, productId, quantity) {
        try{
            const cart = await Cart.findOne({where: {customer_id: customerId}});
            const item = await CartItem.findOne({where: {cart_id: cart.id, product_id: productId}});

            let newItemTotalPrice = 0;
            
            if (item) {
                // can not use += for negative quantity because it will be converted to string
                const productPrice = DecimalUtils.toDecimal((await Product.findByPk(productId)).price);

                newItemTotalPrice = quantity * productPrice;

                cart.total_price = DecimalUtils.toDecimal(cart.total_price);
                cart.total_price = cart.total_price - item.quantity * productPrice + newItemTotalPrice;

                if(quantity>0){
                    item.quantity = quantity;
                    await item.save();
                }
                else{
                    cart.amount_of_items -= 1;

                    await item.destroy();
                }
            } else {
                await CartItem.create({cart_id: cart.id, product_id: productId, quantity: quantity});

                const productPrice = DecimalUtils.toDecimal((await Product.findByPk(productId)).price);
                newItemTotalPrice = quantity * productPrice;
                cart.total_price = DecimalUtils.add(cart.total_price, newItemTotalPrice);

                cart.amount_of_items += 1;
            }
            await cart.save();
            
            return {newItemTotalPrice,cartTotalPrice:cart.total_price};
        }
        catch(error){
            console.error('Error updating cart:', error);
            throw new Error('Internal Server Error');
        }
        
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
        return {cartTotalPrice:cart.total_price};
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