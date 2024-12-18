const cartService = require('../services/cart.services');
const CustomerService = require('../../customer/services/customer.services');

class CartController{
    
    //[GET] /carts
    async index(req, res, next){
        try{
            if(!res.locals.user) return res.render('cart/cart', { products: [], total: 0 });
            const userId = res.locals.user.id;
            const customer = await CustomerService.getByUserId(userId);
            if(!customer) {
                throw new Error('Customer not found');
            }

            const customerId = customer.id;
            
            const {products,total} = await cartService.findAllByCustomerId(customerId);

            res.render('cart/cart', { products, total});
        }
        catch(error){
            console.error('Error getting product list:', error);
            next(error); 
        }
    }

    // [POST] /carts
    async update(req, res){
        try{
            if(!res.locals.user) return res.json([]); // no user logged in

            const customer = await CustomerService.getByUserId(res.locals.user.id);
            if(!customer) return res.status(404).json({ error: 'Customer not found' });

            const customerId = customer.id;
            const products = req.body.products;
            const {newItemsTotalPrice, cartTotalPrice} = await cartService.updateMultipleItems(customerId, products);
            res.status(200).json({ message: 'Your cart has been updated', newItemsTotalPrice, cartTotalPrice });
        }
        catch(error){
            console.error('Error updating cart:', error);
            res.status(500).json({error:error});
        }   
    }

    // [PATCH] /carts/items/decrease/:id
    async decreaseQuantity(req, res){
        try{
            await cartService.decreaseQuantity(req.params.id);
            res.json({ message: 'Product quantity decreased successfully' });
        }
        catch(error){
            console.error('Error decreasing product quantity:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // [DELETE] /carts/items/:productId
    async deleteProduct(req, res){
        try{
            const {cartTotalPrice}=await cartService.deleteProducts(req.params.productId);
            res.json({ message: 'Product deleted from cart successfully',cartTotalPrice });
        }
        catch(error){
            console.error('Error deleting product from cart:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // [GET] /carts/amount-of-items
    async findAmountOfItemsInCartByCustomerId(req, res){
        try{
            if(!res.locals.user) return res.json({ amountOfItems: 0 }); // no user logged in
            const customer = await CustomerService.getByUserId(res.locals.user.id);
            if(!customer) return res.status(404).json({ error: 'Customer not found' });

            const customerId = customer.id;
            const amountOfItems = await cartService.findAmountOfItemsByCustomerId(customerId);
            console.log('Amount of items:', amountOfItems);
            res.json({ amountOfItems });
        }
        catch(error){
            console.error('Error getting amount of items in cart:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new CartController();