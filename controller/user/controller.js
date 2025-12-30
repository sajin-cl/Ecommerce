var database = require('../../config/database');
var mongodb = require('mongodb');


//User Home Page --->
exports.userIndex = (req, res) => {

  const user = req.session?.userData?.user || null;

  database.then(async (db) => {

    const prodData = await db.collection('Products').find().toArray();
    const catData = await db.collection('category').find().toArray();
    res.render('user/home', {
      title: 'Home', prodData, catData, layout: 'userLayout', user, homeActive: true
    });
  });
};


//Single product view --->
exports.singleProductView = (req, res) => {
  let sinProdID = req.params.id;
  database.then((db) => {
    db.collection('Products').findOne({ _id: new mongodb.ObjectId(sinProdID) }).then((sinProdData) => {
      console.info(sinProdData);
      res.render('user/single-product-view', { title: 'Single Product', sinProdData, layout: 'userLayout' });
    });
  });
};


//category section --->
exports.category = (req, res) => {
  let catID = req.params.id;
  database.then(async (db) => {
    const catData = await db.collection('category').findOne({ _id: new mongodb.ObjectId(catID) });
    const prodData = await db.collection('Products').aggregate([

      { $addFields: { 'catID': { '$toObjectId': '$prodCategory' } } },

      { $match: { 'catID': new mongodb.ObjectId(catID) } },

      {
        $lookup: {
          from: 'category',
          localField: 'catID',
          foreignField: '_id',
          as: 'categoryCollection'
        }
      },
      { $unwind: { path: '$categoryCollection', preserveNullAndEmptyArrays: true } }

    ]).toArray();
    console.log(prodData);
    res.render('user/category', { title: 'Category Page', layout: 'userLayout', catData, prodData });
  });
};

//Register page--->
exports.registerPage = (req, res) => {
  res.render('user/register', { title: 'Register', layout: 'userLayout', registerPage: true });
};

//user login
exports.loginPage = (req, res) => {
  res.render('user/login', { title: 'Login', layout: 'userLayout', loginPage: true });
};

//cart page started here --->
exports.cartPage = (req, res) => {
  database.then(async (db) => {
    const user = req.session?.userData;

    if (!user) {
      return res.redirect('/user/login');
    }
    const prodData = await db.collection('Products').find().toArray();
    const cartData = await db.collection('addToCartForm').aggregate([
      { $addFields: { 'prodID': { '$toObjectId': '$product' } } },
      { $match: { userID: new mongodb.ObjectId(user._id), orderStatus: 1 } },

      {
        $lookup: {
          from: 'Products',
          localField: 'prodID',
          foreignField: '_id',
          as: 'cartCollection'
        }
      },
      { $unwind: { path: '$cartCollection', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    const totalProducts = cartData.length;
    console.info(cartData)
    res.render('user/cart', { title: 'cart', layout: 'userLayout', cartData, prodData, totalProducts, cartActive: true });
  });
};

//Order page started here--->
exports.myOrders = (req, res) => {

  database.then(async (db) => {

    const user = req.session.userData;
    if (!user) return res.redirect('/user/login');

    const prodData = await db.collection('Products').find().toArray();
    const cartData = await db.collection('addToCartForm').aggregate([
      { $match: { userID: new mongodb.ObjectId(user._id), orderStatus: 2 } },
      { $addFields: { 'prodID': { '$toObjectId': '$product' } } },
      {
        $lookup: {
          from: 'Products',
          localField: 'prodID',
          foreignField: '_id',
          as: 'orderCollection'
        }
      },
      { $unwind: { path: '$orderCollection', preserveNullAndEmptyArrays: true } },
      { $addFields: { 'catObjID': { '$toObjectId': "$orderCollection.prodCategory" } } },

      {
        $lookup: {
          from: 'category',
          localField: 'catObjID',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } }
    ]).toArray();

    const totalPrice = cartData.reduce((acc, item) => {
      const quantity = item.quantity || 1;
      const price = item.orderCollection?.price || 0;
      return acc + quantity * price;
    }, 0);

    console.log(cartData);
    res.render('user/my-orders', { title: 'My orders', layout: 'userLayout', prodData, cartData, totalPrice, orderActive: true });
  });
};



