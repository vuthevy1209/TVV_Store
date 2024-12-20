const router = require('express').Router();
const orderController = require('../controllers/order.controllers');

router.get('/', orderController.index);
router.post('/checkout', orderController.checkout);

module.exports = router;
