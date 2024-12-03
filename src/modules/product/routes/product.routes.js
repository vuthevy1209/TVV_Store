const express = require('express');
const router = express.Router();

const productController = require('../controllers/product.controllers');

router.get('/', productController.index);
router.get('/search', productController.search);
router.get('/:id', productController.show);


module.exports = router;