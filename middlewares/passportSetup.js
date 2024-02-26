const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/users')
const jwt = require('jsonwebtoken')
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL:
				'https://puce-courageous-coyote.cyclic.app/api/v1/auth/google/redirect',
			// callbackURL: 'http://127.0.0.1:3000/api/v1/auth/google/redirect',
		},
		async function (accessToken, refreshToken, profile, cb) {
			try {
				// console.log(profile)
				let user = await User.findOne({ googleId: profile.id })
				if (!user) {
					user = await User.create({
						firstName: profile.name.givenName,
						lastName: profile.name.familyName,
						photo: profile.photos[0].value,
						password: 'nopassword',
						email: profile.emails[0].value,
						googleId: profile.id,
					})
				}
				// console.log(user)
				// console.log(profile)
				const token = jwt.sign({ id: user.id }, process.env.JWTSECRET, {
					expiresIn: process.env.JWT_EXPIRE_IN,
				})
				cb(null, { user, token })
			} catch (err) {
				cb(err)
			}
		}
	)
)
