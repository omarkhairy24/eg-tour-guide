const router = require('express').Router()
const authController = require('../controllers/authController')
const usersController = require('../controllers/usersController')
////////////////////////////////////////////
router.use(authController.protect)
////////////////////////////////
// For user
router.get('/me', usersController.me, usersController.getUser)
router.patch('/update-password', authController.updatePassword)
router.patch(
	'/update-me',
	usersController.uploadUserPhoto,
	usersController.resizeImage,
	usersController.updateMe
)
router.delete('/delete-me', usersController.deleteMe)
////////////////////////////////////////////
// For admin
router
	.route('/')
	.get(authController.giveAccessTo('admin'), usersController.getAllUsers)
router
	.route('/:id')
	.get(usersController.getUser)
	.patch(authController.giveAccessTo('admin'), usersController.updateUser)
	.delete(authController.giveAccessTo('admin'), usersController.deleteUser)
module.exports = router
