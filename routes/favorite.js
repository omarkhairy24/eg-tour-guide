const favController = require('../controllers/favoriteController');
const authController = require('../controllers/authController');
const router = require('express').Router();

router.get('/my-fav',authController.protect,favController.getFavorites)

router.post('/add-fav-place/:placeId',authController.protect,authController.restrictTo('user'),favController.addFavPlace);

router.post('/add-fav-artifacs/:artifacId',authController.protect,authController.restrictTo('user'),favController.addFavArtifacs);

module.exports = router