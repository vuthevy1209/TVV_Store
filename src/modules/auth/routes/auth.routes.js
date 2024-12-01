const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllers');

router.get('/auth/login', authController.showLoginForm);
router.post('/auth/login', authController.login);
router.get('/auth/register', authController.showRegisterForm);
router.post('/auth/register', authController.register);
router.get('/auth/logout', authController.logout);

module.exports = router;