const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
////////////////////////////////////////////
router.post('/signup', authController.signup)
router.get('/complete-signup/:code', authController.completeSignUp)
router.post('/login', authController.login)
router.post('/forget-password', authController.forgetPassword)
router.patch('/reset-password/:code', authController.resetPassword)
////////////////////////////////////////////
module.exports = router
