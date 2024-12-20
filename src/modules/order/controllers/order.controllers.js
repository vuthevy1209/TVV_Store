const orderService = require('../services/order.services')

class OrderController{

    //[GET] /orders
    async index(req, res){
        try{
            const orders = await orderService.findAllByUserId(req.user.id);
            console.log('Orders fetched successfully');
            console.log(orders);
            res.render('order/checkout', {orders});
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error while fetching orders'});
        }
    }

    //[POST] /orders/checkout
    async checkout(req, res){
        try{
            await orderService.checkout(req.user.id);
            console.log('Order created successfully');
            res.redirect('/orders');
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error while creating order'});
        }
    }
    
}

module.exports = new OrderController();