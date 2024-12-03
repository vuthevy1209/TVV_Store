const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home.controllers');

// [GET] /home
router.get('/home', homeController.index);

// [GET] /contact
router.get('/contact', homeController.contact);

module.exports = router;