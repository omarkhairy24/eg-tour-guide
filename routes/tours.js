const authController = require('../controllers/authController');
const router = require('express').Router();
const tourController = require('../controllers/tourController');

router.get('/all-tours',authController.protect,tourController.getTours);

router.get('/tour/:tourId',authController.protect,tourController.getTour);

router.get('/tour-details/:tourId',tourController.getTourDetails)

router.post('/create-tour',authController.protect,tourController.createTour);

router.patch('/add-places-tour/:tourId',authController.protect,tourController.addPlacesToTour);

router.put('/edit-tour-details/:tourId',authController.protect,tourController.updateTourDetails);

router.delete('/delete-tour/:tourId',authController.protect,tourController.deleteTour);

router.delete('/remove-place-tour/:tourId',authController.protect,tourController.removePlaceFromTour);

module.exports = router