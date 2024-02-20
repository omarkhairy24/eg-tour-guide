const AppError = require('../middlewares/AppError')
const catchAsync = require('../middlewares/catchAsync')
const User = require('../models/users')
const jwt = require('jsonwebtoken')
const { promisify } = require('util')
////////////////////////////////////////////////////////////
const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWTSECRET, {
		expiresIn: process.env.JWT_EXPIRE_IN,
	})
}
////////////////////////////////////////////////////////////
exports.signup = catchAsync(async (req, res, next) => {
	const user = await User.create({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		photo: req.body.photo,
		password: req.body.password,
		email: req.body.email,
		gender: req.body.gender,
		governmentLocation: req.body.governmentLocation,
	})
	const token = signToken(user._id)
	res.status(201).json({
		status: 'success',
		data: {
			token,
			user,
		},
	})
})
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
	const token = signToken(user._id)
	res.status(202).json({
		status: 'success',
		data: {
			token,
		},
	})
})
exports.forgetPassword = catchAsync(async (req, res, next) => {})
exports.resetPassword = catchAsync(async (req, res, next) => {})
exports.updatePassword = catchAsync(async (req, res, next) => {})
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
