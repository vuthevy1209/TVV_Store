const cartService = require('../services/cart.services');
const CustomerService = require('../../customer/services/customer.services');

class CartController{
    
    //[GET] /carts
    async index(req, res){
        try{
            console.log(res.locals.user);
            // Return an empty array if no items are found
            if(!res.locals.user) return res.json([]);
            const userId = res.locals.user.id;
            const customer = await CustomerService.getByUserId(userId);
            if(!customer) return res.json([]);
            const customerId = customer.id;
            
            const {products,total,amountOfItems} = await cartService.findAllByCustomerId(customerId);

            res.render('cart/cart', { products, total,amountOfItems });
        }
        catch(error){
            console.error('Error getting product list:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // [POST] /carts
    async add(req, res){
        try{
            //if(!res.locals.user) return res.json([]); // no user logged in

            const customer = await CustomerService.getByUserId(res.locals.user.id);
            if(!customer) res.status(404).json({ error: 'Customer not found' });

            const customerId = customer.id;
            const { product_id, quantity } = req.body;
            await cartService.add(customerId, product_id, quantity);
            res.status(200).json({ message: 'Your cart has been updated' });
        }
        catch(error){
            console.error('Error adding product to cart:', error);
            res.status(500).json({ error: 'Internal Server Error' });
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
            await cartService.deleteProducts(req.params.productId);
            res.json({ message: 'Product deleted from cart successfully' });
        }
        catch(error){
            console.error('Error deleting product from cart:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

}

module.exports = new CartController();