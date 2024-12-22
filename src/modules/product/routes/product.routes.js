const express = require('express');
const router = express.Router();
const connectEnsureLogin = require("connect-ensure-login");


const productController = require('../controllers/product.controllers');
router.get('/', productController.index);
router.get('/search', productController.search);
router.get('/:id', productController.getProductDetails);

const productReviewController = require('../controllers/productReview.controllers');
// if I use ensureLoggedIn with no options, it will not hit to this route (app run like infinity loop)
router.post('/:productId/reviews', connectEnsureLogin.ensureLoggedIn({ setReturnTo: true, redirectTo: '/auth/login-register' }),  productReviewController.addProductReview);

module.exports = router;