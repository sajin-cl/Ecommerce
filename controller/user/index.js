var express = require('express');
var router = express.Router();
var controller = require('./controller');
const database = require('../../config/database');
var bcrypt = require('bcrypt');
var mongodb = require('mongodb');



router.get('', controller.userIndex);
router.get('/singleproduct/:id', controller.singleProductView);
router.get('/product/category/:id', controller.category);
router.get('/register', controller.registerPage);
router.get('/login', controller.loginPage);
router.get('/cart', controller.cartPage);
router.get('/myorders', controller.myOrders);


//user Registeration
router.post('/register', (req, res) => {

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
  res.redirect('/user/login')
});


//User login
router.post('/login', (req, res) => {

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
});

//User Logout session::
router.get('/logout', (req, res) => {
  req.session.destroy();
  console.info('Logout successfully..!');
  res.redirect('/user/login');
});


/*Cart Page */
//adding product to cart page--->
router.post('/singleproduct/:id', (req, res) => {
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

});


//Delete cart items
router.get('/cartItem/delete/:id', (req, res) => {
  let delID = req.params.id;

  database.then((db) => {
    db.collection('addToCartForm').deleteOne({ _id: new mongodb.ObjectId(delID) }).then((delData) => {
      console.log(delData);
    });
  });
  res.redirect('/user/cart')
});


/* Order page started here  */

router.post('/myorders', (req, res) => {
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
});


module.exports = router;