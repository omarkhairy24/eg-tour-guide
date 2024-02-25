const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')
//////////////////////////////////////////////////
class Email {
	constructor(user, code) {
		this.to = user.email
		this.from = 'admin@itour.com'
		this.firstName = user.firstName
		this.code = code
	}
	createTransporter() {
		if (process.env.NODE_ENV === 'development') {
			return nodemailer.createTransport({
				host: 'sandbox.smtp.mailtrap.io',
				port: 587,
				auth: {
					user: 'c8ff02b4d64202',
					pass: '9167c099f5914f',
				},
			})
		} else {
			return nodemailer.createTransport({
				service: 'gmail',
				host: 'smtp.gmail.com',
				port: 587,
				secure: false,
				auth: {
					user: 'amrmoha960@gmail.com',
					pass: 'sdge hwwj ohwg mkln',
				},
			})
		}
	}
	async send(templete, subject) {
		// render html of pug
		const html = pug.renderFile(
			`${__dirname}/../views/emails/${templete}.pug`,
			{
				firstName: this.firstName,
				subject,
				code: this.code,
			}
		)
		// set options
		const options = {
			to: this.to,
			from: this.from,
			subject,
			text: htmlToText.htmlToText(html),
			html,
		}
		//3 sendmail
		await this.createTransporter().sendMail(options)
	}
	async sendWelcome() {
		await this.send('welcome', 'welcome to our app 😍')
	}
	async sendResetPassword() {
		await this.send(
			'resetPassword',
			'Your password reset code (Valid for 5 min)'
		)
	}
}
module.exports = Email
