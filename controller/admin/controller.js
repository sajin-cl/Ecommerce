var database = require('../../config/database');
var mongodb = require('mongodb');



exports.adminIndex = (req, res) => {

  const admin = req.session?.userData?.user || null;
  console.log("Rendering admin index page");
  res.render('admin/index', { title: 'Admin | index', layout: 'adminLayout',admin });

};


/* Sub category starts here::*/
//Category page starting here-->
exports.adminProductCategory = (req, res) => {
  database.then((db) => {
    db.collection('category').find().toArray().then((catData) => {
      console.log(`Category Collections :\n ${catData}`)
      res.render('admin/category', { title: 'Admin | Categories', layout: 'adminLayout', catData, adminCategoryActive: true });
    });
  });
};


//Add category page starting here-->
exports.addCategory = (req, res) => {
  res.render('admin/categoryForm', { title: 'Admin | Add Categories', layout: 'adminLayout', adminCategoryActive: true });
};

//Edit category page starting here-->
exports.editProdCategory = (req, res) => {
  let editID = req.params.id;

  database.then(async (db) => {
    const catData = await db.collection('category').findOne({ _id: new mongodb.ObjectId(editID) });
    console.info(catData);
    res.render('admin/editCategoryForm', { title: 'Admin | Edit Category', layout: 'adminLayout', catData, adminCategoryActive: true });
  });
};


/* Sub category starts here:: */
//sub category page starting here-->
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

//Add sub category page starting here-->
exports.addSubCategory = (req, res) => {
  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    res.render('admin/subCategoryForm', { title: 'Admin | Add Sub Categories', layout: 'adminLayout', catData, adminSubCategoryActive: true });
  });
};

//Edit sub category page starting here-->
exports.editSubCategory = (req, res) => {
  let editID = req.params.id;

  database.then(async (db) => {

    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').findOne({ _id: new mongodb.ObjectId(editID) });
    console.log(subCatData);
    res.render('admin/editSubCategoryForm', { title: 'Admin | Edit Sub Category', layout: 'adminLayout', catData, subCatData, adminSubCategoryActive: true });
  });
};


/* Products section starts here::*/
//products page starting here-->
exports.adminProducts = (req, res) => {
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

//add products page starting here-->
exports.addProducts = (req, res) => {

  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').find().toArray();
    const prodData = await db.collection('Products').find().toArray();

    res.render('admin/productForm', { title: 'Admin | Add Products', layout: 'adminLayout', catData, subCatData, prodData, adminProductsActive: true });
  });
};

//Edit products page starting here-->
exports.editProducts = (req, res) => {
  let editID = req.params.id;
  database.then(async (db) => {
    const catData = await db.collection('category').find().toArray();
    const subCatData = await db.collection('subCategory').find().toArray();
    const prodData = await db.collection('Products').findOne({ _id: new mongodb.ObjectId(editID) });
    console.log("Edited prodData:", prodData);
    res.render('admin/editProductForm', { title: 'Admin | Edit product', layout: 'adminLayout', catData, prodData, subCatData, adminProductsActive: true });
  });
};


//user list here--->
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

    res.render('admin/view-order', { title: 'Admin | View Orders', layout: 'adminLayout',totalPrice, orders, usersActive: true });
  });
};
