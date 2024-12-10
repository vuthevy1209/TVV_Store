const router = require('express').Router();
const cartController = require('../controllers/cart.controllers');

router.get('/', cartController.index); // get all items in cart
router.post('/', cartController.update); 
router.patch('/items/decrease/:id',cartController.decreaseQuantity); // decrease 1 product when it is already in cart
router.delete('/items/:productId', cartController.deleteProduct);
router.get('/amount-of-items', cartController.findAmountOfItemsInCartByCustomerId);
router.get('/total-price', cartController.findTotalPrice);
// router.get('/:id', cartController.show);
// router.put('/:id', cartController.update);

module.exports = router;