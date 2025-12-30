var express = require('express');
var controller = require('./controller');
var router = express.Router();
var database = require('../../config/database');
var mongodb = require('mongodb');

router.get('', controller.adminIndex);
router.get('/category', controller.adminProductCategory);
router.get('/addcategory', controller.addCategory);
router.get('/editcategory/:id', controller.editProdCategory);

router.get('/subcategory', controller.adminProductSubCategory);
router.get('/addsubcategory', controller.addSubCategory);
router.get('/edisubcategory/:id', controller.editSubCategory);

router.get('/product', controller.adminProducts);
router.get('/addproduct', controller.addProducts);
router.get('/product/edit/:id', controller.editProducts);

router.get('/users', controller.userList);
router.get('/viewOrders/:id', controller.viewOrders);


//Add category---> 
router.post('/addcategory', (req, res) => {
  let categoryList = {
    category: req.body.prodCategory,
    desc: req.body.prodDescription,
    image: req.files?.prodImg.name
  };

  database.then((db) => {
    db.collection('category').insertOne(categoryList).then((catData) => {

      let file = req.files.prodImg;
      file.mv(`public/images/${categoryList.image}`);
      console.log(catData)
    });
  });
  res.redirect('/admin/category')
});

//category updation--->
router.post('/editcategory/:id', (req, res) => {
  let upID = req.params.id;

  let categoryList = {
    category: req.body.prodCategory,
    desc: req.body.prodDescription,
    image: req.files?.prodImg.name
  };

  let catUpdation = '';

  if (req.files?.prodImg) {
    catUpdation = {
      category: categoryList.category,
      desc: categoryList.desc,
      image: categoryList.image
    }

    let file = req.files.prodImg;
    file.mv(`public/images/${categoryList.image}`);

  }
  else {
    catUpdation = {
      category: categoryList.category,
      desc: categoryList.desc
    }
  }

  database.then(async (db) => {

    var catData = await db.collection('category').updateOne({ _id: new mongodb.ObjectId(upID) }, { $set: catUpdation });
    console.info(catData);

  });

  res.redirect('/admin/category')
});

//Category deletion--->
router.get('/deletecategory/:id', (req, res) => {
  let delID = req.params.id;

  database.then(async (db) => {
    var catData = await db.collection('category').deleteOne({ _id: new mongodb.ObjectId(delID) });
    console.info(catData);
  });

  res.redirect('/admin/category');
});


//Add Sub category--->
router.post('/addsubcategory', (req, res) => {

  let subCategoryList = {
    prodCategory: req.body.prodCategory,
    subCategory: req.body.prodSubCategory
  }

  database.then(async (db) => {
    const subCatData = await db.collection('subCategory').insertOne(subCategoryList);
    console.info(subCatData);
  });

  res.redirect('/admin/subcategory');
});


//Sub Category updation--->
router.post('/edisubcategory/:id', (req, res) => {

  let upID = req.params.id;

  let subCategoryList = {
    prodCategory: req.body.prodCategory,
    subCategory: req.body.prodSubCategory
  }

  let subCatUpdation = {
    prodCategory: subCategoryList.prodCategory,
    subCategory: subCategoryList.subCategory
  }

  database.then((db) => {
    db.collection('subCategory').updateOne({ _id: new mongodb.ObjectId(upID) }, { $set: subCatUpdation }).then((subCatData) => {
      console.info(subCatData);
    });
  });
  res.redirect('/admin/subcategory')
});


//Sub category deletion--->
router.get('/deletesubcategory/:id', (req, res) => {
  let delID = req.params.id;
  database.then((db) => {
    db.collection('subCategory').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((subCatData) => {
      console.log(subCatData);
    });
  });
  res.redirect('/admin/subcategory');
});

//Add product items--->
router.post('/addproduct', (req, res) => {

  let productList = {
    prodCategory: req.body.prodCategory,
    prodSubCategory: req.body.prodSubCategory,
    product: req.body.productName,
    desc: req.body.prodDescription,
    price: req.body.prodPrice,
    prodImage: req.files?.prodImg.name
  };

  database.then((db) => {
    db.collection('Products').insertOne(productList).then((prodData) => {
      console.info(prodData);
      let prodFile = req.files?.prodImg;
      prodFile.mv(`public/images/${productList.prodImage}`);
    });
  });
  res.redirect('/admin/product');
});


//Update Product items--->
router.post('/product/edit/:id', (req, res) => {

  let upID = req.params.id;

  let productList = {
    prodCategory: req.body.prodCategory,
    prodSubCategory: req.body.prodSubCategory,
    product: req.body.productName,
    desc: req.body.prodDescription,
    price: req.body.prodPrice,
    prodImage: req.files?.prodImg.name
  };

  let prodUpdation = '';

  if (req.files?.prodImg) {

    prodUpdation = {
      prodCategory: productList.prodCategory,
      prodSubCategory: productList.prodSubCategory,
      product: productList.product,
      desc: productList.desc,
      price: productList.price,
      prodImage: productList.prodImage
    };

    let file = req.files?.prodImg;
    file.mv(`public/images/${productList.prodImage}`);
  }
  else {
    prodUpdation = {
      prodCategory: productList.prodCategory,
      prodSubCategory: productList.prodSubCategory,
      product: productList.product,
      desc: productList.desc,
      price: productList.price,
    };

  };

  database.then((db) => {
    db.collection('Products').updateOne({ _id: new mongodb.ObjectId(upID) }, { $set: prodUpdation }).then((prodData) => {
      console.log(prodData);
    });
  });
  res.redirect('/admin/product');
});


//Delete product items--->
router.get('/product/delete/:id', (req, res) => {
  let delID = req.params.id;

  database.then((db) => {
    db.collection('Products').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((prodData) => {
      console.log(prodData);
    });
  });
  res.redirect('/admin/product');
});


//User list deletion-->
router.get('/users/delete/:id', (req, res) => {
  let delID = req.params.id;

  database.then((db) => {
    db.collection('userInfo').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((delUser) => {
      console.info(`Deleted user${delUser}`)
    });
  });
  res.redirect('/admin/users')
});


module.exports = router;