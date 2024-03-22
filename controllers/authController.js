const AppError = require('../middlewares/AppError')
const catchAsync = require('../middlewares/catchAsync')
const User = require('../models/users')
const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const SendEmail = require('../middlewares/SendMail')
const crypto = require('crypto')
////////////////////////////////////////////////////////////
const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWTSECRET, {
		expiresIn: process.env.JWT_EXPIRE_IN,
	})
}
const sendResWithToken = (user, statusCode, res) => {
	const token = signToken(user.id)
	user.password = undefined
	res.status(statusCode).json({
		status: 'success',
		data: {
			token,
			user,
		},
	})
}

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (roles.includes(req.user.role)) {
			return next(new AppError('not allowed', 403))
		}
		next()
	}
}

////////////////////////////////////////////////////////////
exports.sendCode = catchAsync(async (req, res, next) => {
	const email = req.body.email

	const isExist = await User.findOne({ email: email })
	if (isExist) {
		return next(new AppError('this email already exist', 403))
	}

	const code = crypto.randomInt(100000, 999999)
	await new SendEmail(email, code).sendWelcome()
	res.status(200).json({
		status: 'success',
		message: `Welcome , enter code sent to your mail`,
		code,
		email,
	})
})

exports.signup = catchAsync(async (req, res, next) => {
	const user = await User.create({
		username: req.body.username,
		phone: req.body.phone,
		email: req.body.email,
		password: req.body.password,
	})
	sendResWithToken(user, 201, res)
})

// let current
// exports.signup = catchAsync(async (req, res, next) => {
// 	const {
// 		firstName,
// 		lastName,//
// 		photo,//
// 		password,
// 		email,
// 		gender,//
// 		governmentLocation,//+phone
// 	} = req.body

// 	const user = await User.create({
// 		firstName,
// 		lastName,
// 		photo,
// 		password,
// 		email,
// 		gender,
// 		governmentLocation,
// 	})
// 	current = user
// 	const code = user.createCodeForSignUp()
// 	await user.save()
// 	try {
// 		await new SendEmail(user, code).sendWelcome()
// 		res.status(200).json({
// 			status: 'success',
// 			message: `Welcome ${user.firstName} , enter code sent to your mail`,
// 		})
// 	} catch (err) {
// 		console.log(err)
// 		user.codeSignUp = undefined
// 		user.codeSignUpExpiresIn = undefined
// 		user.save()
// 		return next(new AppError(500, err.message))
// 	}
// })
// exports.completeSignUp = catchAsync(async (req, res, next) => {
// 	const { code } = req.params
// 	const cryptedCode = crypto
// 		.createHash('sha256')
// 		.update(`${code}`)
// 		.digest('hex')
// 	const user = await User.findOne({
// 		codeSignUp: cryptedCode,
// 		codeSignUpExpiresIn: {
// 			$gt: Date.now(),
// 		},
// 	})
// 	if (!user) {
// 		await User.findByIdAndDelete(current.id)
// 		return next(new AppError(400, 'this code might not be valid or correct'))
// 	}
// 	user.codeSignUp = undefined
// 	user.codeSignUpExpiresIn = undefined
// 	await user.save({ validateBeforeSave: false })
// 	sendResWithToken(user, 201, res)
// })

exports.login = catchAsync(async (req, res, next) => {
	// 1
	const { email, password } = req.body
	if (!email || !password)
		return next(new AppError(400, 'enter email and password please'))
	// 2
	const user = await User.findOne({ email }).select('+password')
	//3
	if (!user || !(await user.comparePasswords(password, user.password)))
		return next(new AppError(401, 'your email or password is wrong'))

	//4
	sendResWithToken(user, 202, res)
})
exports.protect = catchAsync(async (req, res, next) => {
	let token
	//1)get the token and check for it
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	)
		token = req.headers.authorization.split(' ')[1]
	//2)verify token
	if (!token) return next(new AppError(401, 'you are not authenticated'))
	const decoded = await promisify(jwt.verify)(token, process.env.JWTSECRET)
	//console.log(decoded)
	//3)check if the user exist
	const user = await User.findById(decoded.id)
	if (!user)
		return next(new AppError(401, 'user is not found , please try again'))
	//4)check if the user changes password after the jwt is issued
	if (user.changePasswordAfterJwt(decoded.iat))
		return next(new AppError(401, 'user changed password,try again'))
	req.user = user
	next()
})
exports.giveAccessTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role))
			return next(new AppError(403, 'you are not authorized'))
		next()
	}
}
exports.forgetPassword = catchAsync(async (req, res, next) => {
	// 1-get user
	const { email } = req.body
	if (!email) return next(new AppError(401, 'enter your mail and try again'))
	const user = await User.findOne({ email })
	if (!user) return next(new AppError(404, 'this user is not found'))

	// 2- generate random 6-digits number
	const randomNum = user.createRandomNumber()
	await user.save({ validateBeforeSave: false })
	// console.log(randomNum)

	//3- send using nodemailer
	try {
		await new SendEmail(user, randomNum).sendResetPassword()
		res.status(200).json({
			status: 'success',
			message: 'email was sent',
		})
	} catch (err) {
		console.log(err)
		user.passwordResetCode = undefined
		user.passwordResetExpireIn = undefined
		await user.save({ validateBeforeSave: false })
		return next(new AppError(500, err.message))
	}
})
exports.resetPassword = catchAsync(async (req, res, next) => {
	const { code } = req.params
	const cryptedCode = crypto
		.createHash('sha256')
		.update(`${code}`)
		.digest('hex')
	const user = await User.findOne({
		passwordResetCode: cryptedCode,
		passwordResetExpireIn: {
			$gt: Date.now(),
		},
	})
	if (!user)
		return next(new AppError(400, 'this code might not be valid or correct'))
	// console.log(user)
	user.password = req.body.password
	user.passwordChangedAt = Date.now()
	user.passwordResetCode = undefined
	user.passwordResetExpireIn = undefined
	await user.save()
	sendResWithToken(user, 201, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
	//1 get user
	const user = await User.findById(req.user.id).select('+password')
	//2 check passwords
	if (!(await user.comparePasswords(req.password, user.password)))
		return next(new AppError(402, 'the password you passed is not correct'))
	//3 update password
	user.password = req.body.password
	await user.save()
	// log user in
	sendResWithToken(user, 200, res)
})

exports.googleRes = catchAsync(async (req, res, next) => {
	const { user, token } = req.user
	res.status(200).json({
		status: 'success',
		data: {
			token,
			user,
		},
	})
})
