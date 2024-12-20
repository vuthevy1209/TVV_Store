const cartService = require('../services/cart.services');

class CartController {
    // [GET] /carts
    async index(req, res, next) {
        try {
            let products, total;
            if (res.locals.user) {
                const userId = res.locals.user.id;
                ({ products, total } = await cartService.findAllByUserId(userId));
            } else {
                ({ products, total } = await cartService.findAllBySession(req.session));
            }
            res.render('cart/cart', { products, total });
        } catch (error) {
            console.error('Error getting product list:', error);
            next(error);
        }
    }

    // [POST] /carts
    async update(req, res) {
        try {
            let result;
            if (res.locals.user) {
                const userId = res.locals.user.id;
                const products = req.body.products;
                result = await cartService.updateMultipleItems(userId, products);
            } else {
                const products = req.body.products;
                result = await cartService.updateMultipleItemsInSession(req.session, products);
            }
            
            res.status(200).json({ message: 'Cart updated successfully', result });
        } catch (error) {
            console.error('Error updating cart:', error);
            res.status(500).send(error.message);
        }
    }

    // [GET] /carts/amount-of-items
    async findAmountOfItemsInCartByCustomerId(req, res) {
        try {
            let amountOfItems;
            if (res.locals.user) {
                const userId = res.locals.user.id;
                amountOfItems = await cartService.findAmountOfItemsByCustomerId(userId);
            } else {
                amountOfItems = await cartService.findAmountOfItemsBySession(req.session);
            }
            res.json({ amountOfItems });
        } catch (error) {
            console.error('Error getting amount of items in cart:', error);
            res.status(500).send('An error occurred');
        }
    }
}

module.exports = new CartController();