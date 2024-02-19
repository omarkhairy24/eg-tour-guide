const mongoose = require('mongoose')
require('dotenv').config()
//////////////////////////////////////////////////////
const app = require('./app')
//DB connection
mongoose.connect(process.env.DB).then((_) => {
	console.log('db connected successfully 🚀')
})

// Server
const server = app.listen(process.env.PORT, () => {
	console.log(`server started on port ${process.env.PORT} . . .`)
})
//////////////////////////////////////////////////////
process.on('unhandledRejection', (error) => {
	console.log('unhandledRejection')
	console.log(`${error.name} - ${error.message}`)
	server.close((_) => {
		process.exit(1)
	})
})
