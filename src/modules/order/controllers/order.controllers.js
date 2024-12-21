const orderService = require('../services/order.services')

class OrderController{

    //[GET] /orders
    async index(req, res){
        try{
            const orders = await orderService.findAllByUserId(req.user.id);
            console.log('Orders fetched successfully');
            console.log(orders);
            //res.render('order/checkout', {orders}); HAVEN'T CREATED THIS VIEW YET
            return res.status(200).json(orders);
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error while fetching orders'});
        }
    }

    //[POST] /orders/checkout
    async checkout(req, res){
        try{
            const orderId = await orderService.checkout(req.user.id);
            console.log('Order created successfully');
            res.json({redirectUrl: `/orders/checkout?orderId=${orderId}`});
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error while creating order'});
        }
    }

    //[GET] /orders/checkout
    async checkoutSuccess(req, res){
        try{
            const hashOrderId = req.query.orderId;
            const order = await orderService.fetchOrderById(hashOrderId);
            console.log('Order fetched successfully');
            res.render('order/checkout', {order}); 
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error while fetching order'});
        }
    }
    
}

module.exports = new OrderController();