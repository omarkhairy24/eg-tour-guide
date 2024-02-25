const express = require('express')
// const morgan = require('morgan')
const path = require('path')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const compression = require('compression')
//////////////////////////////////////////////////////
const app = express()
const authRoute = require('./routes/auth')
const usersRoute = require('./routes/users')
const AppError = require('./middlewares/AppError')
const globalErrorHandlingMiddleware = require('./controllers/globalHandlerError')
/////////////////////////////////////
// Middlewares
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json({ limit: '10kb' }))
app.use(mongoSanitize())
app.use(xss())
app.use(helmet({ contentSecurityPolicy: false }))
const limiter = rateLimit({
	max: 100,
	window: 60 * 60 * 1000, //1hour
	message: 'Too many requests from the same IP , try again after 1hour',
})
app.use('/api', limiter)
app.use(compression())
// if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))
//////////////////////////////////////////////////////
// Mounting routes
app.use('/api/v1/auth', authRoute)
app.use('/api/v1/users', usersRoute)
app.all('*', (req, res, next) => {
	next(new AppError(404, 'this route is not defined'))
})
app.use(globalErrorHandlingMiddleware)
//////////////////////////////////////////////////////
module.exports = app
