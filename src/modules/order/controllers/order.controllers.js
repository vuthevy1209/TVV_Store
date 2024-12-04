const orderService = require('../services/order.services');

class OrderController{

    //[POST] /checkout
    async checkout(req, res){
        try{
            if(!res.locals.user){
                res.status(401).json({message: 'Unauthorized'});
            }
            const items = req.body.items;
            const order = await orderService.checkout(res.locals.user.id, items);
            res.json({order});
            //res.render('order/checkout', {order});
        }
        catch(err){
            console.log(err);
            return res.status(500).json({message: 'Internal server error'});
        }
    }
    
}

module.exports = new OrderController();