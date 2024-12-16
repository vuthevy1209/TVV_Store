const router = require('express').Router();
const orderController = require('../controllers/order.controllers');

router.post('/checkout', orderController.checkout);

module.exports = router;



// CART PAGE
// - KHI NHẤN CHECKOUT TRÊN CART PAGE, SẼ GỌI  order/checkout ĐỂ TẠO ORDER MỚI 
//     --> lấy items từ cart --> cho qua order items  --> STATUS CỦA ORDER SẼ LÀ UNCOMPLETD
//     --> REMOVE  ITEMS KHỎI CART 
