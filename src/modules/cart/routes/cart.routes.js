const router = require('express').Router();
const cartController = require('../controllers/cart.controllers');

router.get('/', cartController.index); // get all items in cart
router.post('/', cartController.update); 

router.get('/amount-of-items', cartController.findAmountOfItemsInCartByCustomerId);


module.exports = router;