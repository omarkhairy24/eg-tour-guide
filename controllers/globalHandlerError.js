const AppError = require('../middlewares/AppError')
///////////////////////////////////////////////////////
const handleTokenError = (_) => {
	return new AppError(401, 'invalid token , please login again')
}
const handleExpiredToken = (_) => {
	return new AppError(401, 'token expired, please login again')
}
const handleInvalidIdDB = (err) => {
	let message = `Invalid ${err.path} : ${err.value}`
	return new AppError(400, message)
}
const handleDuplicateValDB = (err) => {
	let messageErr = `duplicate field value: ${err.keyValue.name}`
	return new AppError(400, messageErr)
}
const handleValidationDB = (err) => {
	let message = ` Invalid input data: ${Object.values(err.errors)
		.map((ele) => ele.message)
		.join('. ')}`
	return new AppError(400, message)
}
///////////////////////////////////////////////////////
let sendErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		data: {
			message: err.message,
			error: err,
			stack: err.stack,
		},
	})
}
let sendErrorProd = (err, res) => {
	if (err.isOperational) {
		res.status(err.statusCode).json({
			status: err.status,
			data: {
				message: err.message,
			},
		})
	} else {
		console.log(err)
		res.status(err.status).json({
			status: err.status,
			message: 'something went wrong , please try again',
		})
	}
}
///////////////////////////////////////////////////////

module.exports = (error, req, res, next) => {
	error.statusCode ||= 500
	error.status ||= 'error'
	if (process.env.NODE_ENV === 'development') sendErrorDev(error, res)
	else if (process.env.NODE_ENV === 'production') {
		let err = { ...error }
		err.message = error.message
		if (error.name === 'CastError') err = handleInvalidIdDB(err)
		if (error.code === 11000) err = handleDuplicateValDB(err)
		if (error._message === 'Validation failed') err = handleValidationDB(err)
		if (error.name === 'JsonWebTokenError') err = handleTokenError()
		if (error.name === 'tokenExpiredError') err = handleExpiredToken()
		sendErrorProd(err, res)
	}
}
