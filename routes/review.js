const router = require('express').Router();
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

router.post('/add-Preview/:placeId',authController.protect,authController.restrictTo('user'),reviewController.addPlaceReview);

router.post('/add-Treview/:tourId',authController.protect,authController.restrictTo('user'),reviewController.addToursReview);

router.put('/update-review/:reviewId',authController.protect,reviewController.updateReview);

router.delete('/delete-review/:reviewId',authController.protect,reviewController.deleteReview);

module.exports = router;