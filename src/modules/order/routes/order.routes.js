const router = require('express').Router();
const orderController = require('../controllers/order.controllers');

const {checkOwnership} = require('../../../middlewares/authorization.middleware');

router.get('/', orderController.index);
router.post('/checkout', orderController.checkout);
router.get('/checkout', orderController.checkoutSuccess);

module.exports = router;
