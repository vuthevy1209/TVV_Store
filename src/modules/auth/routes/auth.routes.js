const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');
const validator = require('../../../middlewares/validation.middleware');

router.get('/login-register', authController.showLoginForm);
router.post('/login', authController.login);
//router.get('/register', authController.showRegisterForm);
router.post('/register', validator.validateRegistration,authController.register);
router.get('/logout', authController.logout);

module.exports = router;