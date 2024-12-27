const router = require('express').Router();
const orderController = require('../controllers/order.controllers');
const validator = require('../../../middlewares/validation.middleware');

const {checkOwnership} = require('../../../middlewares/authorization.middleware');
const {confirmed} = require('../../../middlewares/confirm.middleware');


router.get('/', orderController.index);


//router.post('/checkout/initiate', orderController.initiateOrder);
router.get('/checkout',orderController.checkout);

router.post('/checkout/cash',validator.validateShipment, orderController.checkoutCash);

router.post('/checkout/vnpay',validator.validateShipment, orderController.checkoutVnpay);
router.get('/vnpay_return', orderController.verifyVnpayReturnUrl);

router.get('/confirmation', orderController.orderConfirmation);

module.exports = router;
