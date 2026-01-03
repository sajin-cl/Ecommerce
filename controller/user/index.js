var express = require('express');
var router = express.Router();
var controller = require('./controller');

router.get('', controller.userIndex);
router.get('/singleproduct/:id', controller.singleProductView);
router.get('/product/category/:id', controller.category);
router.get('/register', controller.registerPage);
router.post('/register', controller.registerUser)
router.get('/login', controller.loginPage);
router.post('/login', controller.loginUser);
router.get('/logout', controller.userLogout);
router.get('/cart', controller.cartPage);
router.post('/singleproduct/:id', controller.singleProductView);
router.get('/cartItem/delete/:id', controller.deleteCartItem);
router.get('/myorders', controller.myOrders);
router.post('/myorders', controller.placeOrder);


module.exports = router;