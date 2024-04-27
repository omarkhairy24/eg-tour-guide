const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const passport = require('passport')
////////////////////////////////////////////
router.post('/send-code',authController.sendCode);
router.post('/signup', authController.signup)
// router.get('/complete-signup/:code', authController.completeSignUp)
router.post('/login', authController.login)
router.post('/forget-password', authController.forgetPassword)
router.patch('/reset-password/:code', authController.resetPassword)

router.get(
	'/google',
	passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get(
	'/google/redirect',
	passport.authenticate('google', {
		failureRedirect: '/login',
		session: false,
	}),
	authController.googleRes
)
////////////////////////////////////////////
module.exports = router
