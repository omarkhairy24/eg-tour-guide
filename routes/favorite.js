const favController = require('../controllers/favoriteController');
const authController = require('../controllers/authController');
const router = require('express').Router();

router.get('/my-fav',authController.protect,favController.getFavorites)

router.post('/add-fav/:placeId',authController.protect,authController.restrictTo('user'),favController.addFav);

module.exports = router