var database = require('../../config/database');
var mongodb = require('mongodb');


exports.adminIndex = (req, res) => {
  const admin = req.session?.userData?.user || null;
  console.log("Rendering admin index page");
  res.render('admin/index', { title: 'Admin | index', layout: 'adminLayout', admin });
};


/* Category starts here::*/
//Category  starting here-->
exports.adminProductCategory = (req, res) => {
  database.then((db) => {
    db.collection('category').find().toArray().then((catData) => {
      console.log(`Category Collections :\n ${catData}`)
      res.render('admin/category', { title: 'Admin | Categories', layout: 'adminLayout', catData, adminCategoryActive: true });
    });
  });
};


//Add category  starting here-->
exports.addCategoryPage = (req, res) => {
  res.render('admin/categoryForm', { title: 'Admin | Add Categories', layout: 'adminLayout', adminCategoryActive: true });
};

exports.createCategory = (req, res) => {
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
};

//Update category  starting here-->
exports.updateCategoryPage = (req, res) => {
  let editID = req.params.id;

  database.then(async (db) => {
    const catData = await db.collection('category').findOne({ _id: new mongodb.ObjectId(editID) });
    console.info(catData);
    res.render('admin/editCategoryForm', { title: 'Admin | Edit Category', layout: 'adminLayout', catData, adminCategoryActive: true });
  });
};

exports.updateCategory = (req, res) => {
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
};

exports.deleteCategory = (req, res) => {
  let delID = req.params.id;

  database.then(async (db) => {
    var catData = await db.collection('category').deleteOne({ _id: new mongodb.ObjectId(delID) });
    console.info(catData);
  });

  res.redirect('/admin/category');
};


/* Sub category starts here:: */
exports.adminProductSubCategory = (req, res) => {
  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').aggregate([
      { $addFields: { 'prodCatID': { '$toObjectId': '$prodCategory' } } },
      {
        $lookup: {
          from: 'category',
          localField: 'prodCatID',
          foreignField: '_id',
          as: 'categoryCollection'
        }
      },
      { $unwind: '$categoryCollection' }
    ]).toArray();
    console.info(subCatData);
    res.render('admin/subCategory', { title: 'Admin | Sub Categories', layout: 'adminLayout', subCatData, catData, adminSubCategoryActive: true });
  });
};

//Add sub category  starting here-->
exports.addSubCategoryPage = (req, res) => {
  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    res.render('admin/subCategoryForm', { title: 'Admin | Add Sub Categories', layout: 'adminLayout', catData, adminSubCategoryActive: true });
  });
};

exports.addSubCategory = (req, res) => {
  let subCategoryList = {
    prodCategory: req.body.prodCategory,
    subCategory: req.body.prodSubCategory
  }

  database.then(async (db) => {
    const subCatData = await db.collection('subCategory').insertOne(subCategoryList);
    console.info(subCatData);
  });
  res.redirect('/admin/subcategory');
};

//Update sub category  starting here-->
exports.updateSubCategoryPage = (req, res) => {
  let editID = req.params.id;

  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').findOne({ _id: new mongodb.ObjectId(editID) });
    console.log(subCatData);
    res.render('admin/editSubCategoryForm', { title: 'Admin | Edit Sub Category', layout: 'adminLayout', catData, subCatData, adminSubCategoryActive: true });
  });
};

exports.updateSubCategory = (req, res) => {
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
};

exports.deleteSubCategory = (req, res) => {
  let delID = req.params.id;
  database.then((db) => {
    db.collection('subCategory').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((subCatData) => {
      console.log(subCatData);
    });
  });
  res.redirect('/admin/subcategory');
};

/* Products section starts here::*/
exports.adminProductsPage = (req, res) => {
  database.then(async (db) => {

    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').find().toArray();
    const prodData = await db.collection('Products').aggregate([
      { $addFields: { 'prodSubCatID': { '$toObjectId': '$prodSubCategory' } } },
      {
        $lookup: {
          from: "subCategory",
          localField: "prodSubCatID",
          foreignField: "_id",
          as: "subCategoryData"
        }
      },
      { $unwind: { path: "$subCategoryData", preserveNullAndEmptyArrays: true } },
      { $addFields: { 'prodCatID': { '$toObjectId': '$prodCategory' } } },
      {
        $lookup: {
          from: "category",
          localField: "prodCatID",
          foreignField: "_id",
          as: "categoryData"
        }
      },
      { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
    ]).toArray();

    console.log("Raw Products:", prodData);
    res.render('admin/product', { title: 'Admin | Products', layout: 'adminLayout', catData, subCatData, prodData, adminProductsActive: true });
  });
};

//Add products  starting here-->
exports.addProductsPage = (req, res) => {

  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').find().toArray();
    const prodData = await db.collection('Products').find().toArray();

    res.render('admin/productForm', { title: 'Admin | Add Products', layout: 'adminLayout', catData, subCatData, prodData, adminProductsActive: true });
  });
};

exports.addProducts = (req, res) => {
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
};

//update products  starting here-->
exports.updateProductsPage = (req, res) => {
  let editID = req.params.id;
  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').find().toArray();
    const prodData = await db.collection('Products').findOne({ _id: new mongodb.ObjectId(editID) });
    console.log("Edited prodData:", prodData);
    res.render('admin/editProductForm', { title: 'Admin | Edit product', layout: 'adminLayout', catData, prodData, subCatData, adminProductsActive: true });
  });
};

exports.updateProducts = (req, res) => {
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
};

//Delete products
exports.deleteProduct = (req, res) => {
  let delID = req.params.id;

  database.then((db) => {
    db.collection('Products').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((prodData) => {
      console.log(prodData);
    });
  });
  res.redirect('/admin/product');
};


//User list here--->
exports.userList = (req, res) => {
  database.then((db) => {

    db.collection('userInfo').find().toArray().then((userData) => {
      console.info(userData);
      res.render('admin/userList', { title: 'Admin | User list', layout: 'adminLayout', userData, usersActive: true });
    });
  });
};


//View orders--->
exports.viewOrders = (req, res) => {
  const userId = req.params.id;

  database.then(async (db) => {
    const orders = await db.collection('addToCartForm').aggregate([
      { $match: { userID: new mongodb.ObjectId(userId), orderStatus: 2 } },

      { $addFields: { 'prodID': { $toObjectId: '$product' } } },
      {
        $lookup: {
          from: 'Products',
          localField: 'prodID',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },


      { $addFields: { 'catObjID': { '$toObjectId': '$productInfo.prodCategory' } } },
      {
        $lookup: {
          from: 'category',
          localField: 'catObjID',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }

    ]).toArray();
    console.log(orders);

    const totalPrice = orders.reduce((acc, item) => {
      const quantity = item.quantity || 1;
      const price = item.productInfo?.price || 0;
      return acc + quantity * price;
    }, 0);

    res.render('admin/view-order', { title: 'Admin | View Orders', layout: 'adminLayout', totalPrice, orders, usersActive: true });
  });
};

//Delete User
exports.deleteUser = (req, res) => {
  let delID = req.params.id;

  database.then((db) => {
    db.collection('userInfo').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((delUser) => {
      console.info(`Deleted user${delUser}`)
    });
  });
  res.redirect('/admin/users')
};
