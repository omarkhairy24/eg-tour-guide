const AppError = require('../middlewares/AppError')
const catchAsync = require('../middlewares/catchAsync')
const User = require('../models/users')
const multer = require('multer')
const sharp = require('sharp')
//////////////////////////////////////////////
let filterObj = (body, ...allowable) => {
	let obj = {}
	Object.keys(body).forEach((key) => {
		if (allowable.includes(key)) obj[key] = body[key]
	})
	return obj
}
//////////////////////////////////////////////
// const multerStorage = multer.diskStorage({
// 	destination: (req, file, cb) => {
// 		cb(null, 'public/img/users')
// 	},
// 	filename: (req, file, cb) => {
// 		let ext = file.mimetype.split('/')[1]
// 		cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
// 	},
// })
const multerStorage = multer.memoryStorage()
const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) cb(null, true)
	else cb(new AppError(400, 'only images are accepted'), false)
}
const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
})
exports.resizeImage = (req, res, next) => {
	if (!req.file) next()
	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
	sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 80 })
		.toFile(`public/img/users/${req.file.filename}`)
	next()
}
exports.uploadUserPhoto = upload.single('photo')
//////////////////////////////////////////////
exports.getAllUsers = catchAsync(async (req, res, next) => {
	const users = await User.find()
	res.status(200).json({
		status: 'success',
		data: {
			users,
		},
	})
})
exports.getUser = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id)
	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	})
})
exports.updateUser = catchAsync(async (req, res, next) => {
	const user = await User.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})
	res.status(200).json({
		status: 'success',
		data: {
			user,
		},
	})
})
exports.deleteUser = catchAsync(async (req, res, next) => {
	await User.findByIdAndDelete(req.params.id)
	res.status(204).json({
		status: 'success',
		data: null,
	})
})

exports.me = (req, res, next) => {
	req.params.id = req.user._id
	next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
	if (req.body.password)
		return next(new AppError(406, 'password is not acceptable here'))
	let filterBody = filterObj(
		req.body,
		'firstName',
		'lastName',
		'email',
		'governmentLocation'
	)
	if (req.file) filterBody.photo = req.file.filename
	const user = await User.findByIdAndUpdate(req.user.id, filterBody, {
		new: true,
		runValidators: true,
	})
	res.status(200).json({
		status: 'success',
		user,
	})
})
exports.deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user._id, { active: false })
	res.status(204).json({
		status: 'success',
		data: null,
	})
})
