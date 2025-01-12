const express = require('express');
const AuthController = require('../modules/auth/controllers/auth.controllers');
const passport = require('../config/auth/passport');
const connectEnsureLogin = require('connect-ensure-login');

const authRouter = require('../modules/auth/routes/auth.routes');
const productRouter = require('../modules/product/routes/product.routes');
const homeRouter = require('../modules/home/routes/home.routes');
const cartRouter = require('../modules/cart/routes/cart.routes');
const orderRouter = require('../modules/order/routes/order.routes');
const userRouter = require('../modules/user/routes/user.routes');
const paymentRouter = require('../modules/payment/routes/payment.routes');

const router = express.Router();

router.use('/auth/login/google', passport.authenticate('google'));
router.use('/oauth2/redirect/google', AuthController.googleCallback);

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/user', userRouter);

router.use('/carts', cartRouter);
router.use('/orders', connectEnsureLogin.ensureLoggedIn({ setReturnTo: true, redirectTo: '/auth/login-register' }), orderRouter);
router.get('/config', (req, res) => {
    res.json({ ipInfoToken: process.env.IPINFO_TOKEN });
});
router.use('/', homeRouter);

module.exports = router;