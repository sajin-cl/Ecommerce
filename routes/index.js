var express = require('express');
var router = express.Router();
var controller = require('../controller')

router.use('/', controller);

module.exports = router;
