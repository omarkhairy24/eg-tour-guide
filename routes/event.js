const authController = require('../controllers/authController');
const router = require('express').Router();
const eventController = require('../controllers/eventController');
const uploadImages = require('../controllers/placeController').uploadImages 

router.get('/get-event/:eventId',eventController.getEvent);

router.get('/get-events',eventController.getEvents);

router.post('/add-event',authController.protect,authController.restrictTo('admin'),uploadImages,eventController.addEvent);

router.put('/edit-event/:eventId',authController.protect,authController.restrictTo('admin'),uploadImages,eventController.editEvent);

router.delete('/delete-event/:eventId',authController.protect,authController.restrictTo('admin'),eventController.deleteEvent);

module.exports = router