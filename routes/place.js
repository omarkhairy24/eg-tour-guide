const placeController = require('../controllers/placeController');
const authController = require('../controllers/authController');
const router = require('express').Router();

router.get('/:placeId',placeController.getPlace);

router.get('/',placeController.getPlaces);

router.post('/add-place',authController.protect,authController.restrictTo('admin'),placeController.uploadImages,placeController.createPlace);

router.put('/edit-place/:placeId',authController.protect,authController.restrictTo('admin'),placeController.uploadImages,placeController.updatePlace);

router.delete('/delete-place/:placeId',authController.protect,authController.restrictTo('admin'),placeController.deletePlace)

module.exports = router