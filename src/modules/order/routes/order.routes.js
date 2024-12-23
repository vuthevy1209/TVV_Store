const router = require('express').Router();
const orderController = require('../controllers/order.controllers');
const validator = require('../../../middlewares/validation.middleware');

const {checkOwnership} = require('../../../middlewares/authorization.middleware');
const {confirmed} = require('../../../middlewares/confirm.middleware');


router.get('/', orderController.index);


router.post('/checkout/initiate', orderController.initiateOrder);
router.get('/checkout',confirmed, orderController.checkout);

router.post('/checkout/cash/:orderId',confirmed, validator.validateShipment, orderController.checkoutCash);

router.post('/checkout/vnpay',confirmed,validator.validateShipment, orderController.checkoutVnpay);
router.get('/vnpay_return', orderController.verifyVnpayReturnUrl);

router.get('/confirmation', orderController.orderConfirmation);

module.exports = router;
