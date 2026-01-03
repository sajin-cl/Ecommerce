var express = require('express');
var controller = require('./controller');
var router = express.Router();


router.get('', controller.adminIndex);
router.get('/category', controller.adminProductCategory);
router.get('/addcategory', controller.addCategoryPage);
router.post('/addcategory', controller.createCategory);
router.get('/editcategory/:id', controller.updateCategoryPage);
router.post('/editcategory/:id', controller.updateCategory);
router.get('/deletecategory/:id', controller.deleteCategory);

router.get('/subcategory', controller.adminProductSubCategory);
router.get('/addsubcategory', controller.addSubCategoryPage);
router.post('/addsubcategory', controller.addSubCategory);
router.get('/edisubcategory/:id', controller.updateSubCategoryPage);
router.post('/edisubcategory/:id', controller.updateSubCategory);
router.get('/deletesubcategory/:id', controller.deleteSubCategory);

router.get('/product', controller.adminProductsPage);
router.get('/addproduct', controller.addProductsPage);
router.post('/addproduct', controller.addProducts);
router.get('/product/edit/:id', controller.updateProductsPage);
router.post('/product/edit/:id', controller.updateProducts);
router.get('/product/delete/:id', controller.deleteProduct);

router.get('/users', controller.userList);
router.get('/viewOrders/:id', controller.viewOrders);
router.get('/users/delete/:id', controller.deleteUser);



module.exports = router;