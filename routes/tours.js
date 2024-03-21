const authController = require('../controllers/authController');
const router = require('express').Router();
const tourController = require('../controllers/tourController');

router.get('/tour/:tourId',tourController.getTour);

router.post('/create-tour',authController.protect,tourController.createTour);

router.put('/update-tour/:tourId',authController.protect,tourController.updateTour);

router.delete('/delete-tour/:tourId',authController.protect,tourController.deleteTour);

module.exports = router