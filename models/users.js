const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const schema = new mongoose.Schema({
	firstName: {
		type: String,
		required: [true, 'you should have a first name'],
	},
	lastName: {
		type: String,
		required: [true, 'you should have a last name'],
	},
	photo: {
		type: String,
		default: 'default.js',
	},
	role: {
		type: String,
		enum: ['user', 'admin'],
		default: 'user',
	},
	password: {
		type: String,
		required: [true, 'you should have password'],
		minLength: 8,
		select: false,
	},
	email: {
		type: String,
		validate: [validator.isEmail, 'your email is not valid'],
		required: [true, 'you should have email'],
		lowerCase: true,
		unique: true,
	},
	gender: {
		type: String,
		required: [true, 'you should have a gender'],
		enum: ['male', 'female', 'some thing else'],
	},
	governmentLocation: {
		type: String,
		required: [true, 'enter your government'],
	},
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
	passwordChangedAt: {
		type: Date,
	},
})
/////////////////////////////////////////////
schema.pre('save', async function (next) {
	if (!this.isModified('password')) return next()
	this.password = await bcryptjs.hash(this.password, 12)
	next()
})
/////////////////////////////////////////////
schema.methods.comparePasswords = async function (plain, hashed) {
	return await bcryptjs.compare(plain, hashed)
}
schema.methods.changePasswordAfterJwt = function (jwtTimeStamp) {
	if (this.passwordChangedAt) {
		const passwordTimeChangeMs = this.passwordChangedAt.getTime() / 1000
		// console.log(this.passwordChangedAt.getTime() / 1000, jwtTimeStamp) 1708293600 1708458743
		return passwordTimeChangeMs > jwtTimeStamp
	}
	return false
}
/////////////////////////////////////////////
const User = mongoose.model('User', schema)
module.exports = User
