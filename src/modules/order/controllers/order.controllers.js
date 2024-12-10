const orderService = require('../services/order.services');

class OrderController{

    //[GET] /orders
    async index(req, res){
        try{
            const orders = await orderService.findAllByCustomerId(res.locals.user.id);
            res.json({orders});
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error'});
        }
    }

    //[POST] /checkout
    async checkout(req, res){
        try{
            const items = req.body.items;
            const order = await orderService.checkout(res.locals.user.id, items);
            // res.json({order});
            //res.render('order/checkout', {order});
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error'});
        }
    }
    
}

module.exports = new OrderController();