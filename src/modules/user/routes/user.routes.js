// src/routes/user.js
const express = require('express');
const router = express.Router();
const upload = require('../../../config/upload');
const userController = require('../controllers/user.controllers');

router.post('/update-profile', upload.single('avatar'), userController.updateProfile);
router.get('/profile', userController.getProfile);
module.exports = router;