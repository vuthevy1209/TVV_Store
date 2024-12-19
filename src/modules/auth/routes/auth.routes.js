const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');
const validator = require('../../../middlewares/validation.middleware');

router.get('/login-register', authController.showLoginForm);
router.post('/login', authController.login);
//router.get('/register', authController.showRegisterForm);
router.post('/register', validator.validateRegistration,authController.register);
router.get('/logout', authController.logout);
router.get('/verify', authController.verifyUser);
router.post('/forgot-password', authController.forgotPassword);
router.get('/confirm-reset-password', authController.confirmResetPassword);
router.post('/change-password', validator.validatePassword,authController.changePassword);

module.exports = router;