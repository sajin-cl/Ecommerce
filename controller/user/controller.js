var database = require('../../config/database');
var mongodb = require('mongodb');
var bcrypt = require('bcrypt');


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

exports.singleProductView = (req, res) => {
  let sinProdID = req.params.id;
  database.then((db) => {
    db.collection('Products').findOne({ _id: new mongodb.ObjectId(sinProdID) }).then((sinProdData) => {
      console.info(sinProdData);
      res.render('user/single-product-view', { title: 'Single Product', sinProdData, layout: 'userLayout' });
    });
  });
};

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


exports.registerPage = (req, res) => {
  res.render('user/register', { title: 'Register', layout: 'userLayout', registerPage: true });
};

exports.registerUser = (req, res) => {
  let userDetails = {
    userName: req.body.user,
    email: req.body.email,
    password: req.body.password,
    userStatus: 1
  };

  database.then((db) => {
    bcrypt.hash(userDetails.password, 10).then((resPass) => {
      userDetails.password = resPass;
      db.collection('userInfo').insertOne(userDetails).then((userData) => {
        console.log(userData);
      });
    });
  })
  res.redirect('/user/login');
}

exports.loginPage = (req, res) => {
  res.render('user/login', { title: 'Login', layout: 'userLayout', loginPage: true });
};

exports.loginUser = (req, res) => {
  let userLoginDetails = {
    email: req.body.email,
    password: req.body.password
  }

  database.then((db) => {
    db.collection('userInfo').findOne({ email: userLoginDetails.email }).then((userData) => {
      console.log(userData);

      if (userData) {
        bcrypt.compare(userLoginDetails.password, userData.password).then((userPass) => {
          if (userPass) {
            if (userData.userStatus == 1) {
              req.session.userData = userData;
              res.redirect('/user');
            }
            else if (userData.userStatus == 0) {
              req.session.userData = userData;
              res.redirect('/admin')
            }
            else {
              console.log('userStatus not found');
            }
          }
          else {
            console.log('Incorrect Password!');
            res.redirect('/user/login');
          }
        });
      }
      else {
        console.info('user not found!');
        res.redirect('/user/login');
      }
    });
  });
};

exports.userLogout = (req, res) => {
  req.session.destroy();
  console.info('Logout successfully..!');
  res.redirect('/user/login');
}

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

exports.singleProductView = (req, res) => {
  const cartProdID = req.params.id;
  const user = req.session.userData;

  if (!user) {
    return res.redirect('/user/login')
  };

  const addToCartFormData = {
    userID: new mongodb.ObjectId(user._id),
    product: cartProdID,
    orderStatus: 1,
    quantity: 1
  };

  database.then(async (db) => {

    const existingData = await db.collection('addToCartForm').findOne({
      userID: new mongodb.ObjectId(user._id),
      product: cartProdID
    });

    if (existingData) {
      console.info('Product already in the cart!');
      return res.redirect(`/user/singleproduct/${cartProdID}`);
    }


    const cartData = await db.collection('addToCartForm').insertOne(addToCartFormData);
    console.info('Product added to cart:', cartData);
    res.redirect(`/user/singleproduct/${cartProdID}`);
  });

};

exports.deleteCartItem = (req, res) => {
  let delID = req.params.id;

  database.then((db) => {
    db.collection('addToCartForm').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((delData) => {
      console.log(delData);
    });
  });
  res.redirect('/user/cart')
};

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

exports.placeOrder = (req, res) => {
  const user = req.session.userData;
  if (!user) return res.redirect('/user/login');

  let { productIds, quantities } = req.body;
  if (!productIds) return res.status(400).send('No products selected');

  // Normalize arrays
  if (!Array.isArray(productIds)) productIds = [productIds];
  if (!Array.isArray(quantities)) quantities = [quantities];

  const objectIds = productIds.map(id => new mongodb.ObjectId(id));

  database.then(async (db) => {
    for (let i = 0; i < objectIds.length; i++) {
      await db.collection('addToCartForm').updateOne(
        { userID: new mongodb.ObjectId(user._id), _id: objectIds[i] },
        { $set: { quantity: parseInt(quantities[i]), orderStatus: 2 } }
      );
    }
    res.redirect('/user/myorders');

  });
};





