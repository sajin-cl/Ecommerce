var express = require('express');
var router = express.Router();
var admin = require('./admin');
var user = require('./user');

router.use('/admin', admin);
router.use('/user', user);

module.exports = router;