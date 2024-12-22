const router = require('express').Router();
const orderController = require('../controllers/order.controllers');
const validator = require('../../../middlewares/validation.middleware');

const {checkOwnership} = require('../../../middlewares/authorization.middleware');

router.get('/', orderController.index);
router.post('/checkout/initiate', orderController.initiateOrder);
router.get('/checkout', orderController.checkoutSuccess);
router.post('/checkout/confirm/:orderId', validator.validateShipmentAndCardDetails, orderController.confirmOrder);

module.exports = router;
