const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userService = require('../../modules/user/services/user.services');
const bcrypt = require('bcrypt');
const User = require('../../modules/user/models/user')
const GoogleStrategy = require("passport-google-oidc");
const FederatedCredential = require("../../modules/auth/models/federatedCredential");
const customerService = require("../../modules/customer/services/customer.services");
const authService = require("../../modules/auth/services/auth.services");

passport.serializeUser(function(user, cb) { // store user in session
    process.nextTick(function() {
        console.log(user.firstName)
        console.log(user.lastName)
        cb(null, { id: user.id, username: user.username, firstName: user.first_name, lastName: user.last_name }); // store id and username in session
    });
});

passport.deserializeUser(function(user, cb) { // retrieve user from session
    process.nextTick(function() {
        return cb(null, user);
    });
});



passport.use(
    new LocalStrategy(
        {
            usernameField: "username",
            passwordField: "password",
        },
        async (username, password, cb) => {
            try {
                const user = await userService.findByUsername(username);

                if (!user) {
                    return cb(null, false, { message: "User not found" });
                }

                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return cb(null, false, { message: "Incorrect password" });
                }

                return cb(null, user);
            } catch (err) {
                return cb(err);
            }
        }
    ));

// Dynamically determine the base URL
const BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.PROD_BASE_URL // Production URL
    : process.env.DEV_BASE_URL;


const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientID || !clientSecret) {
    throw new Error('Google client ID and secret must be provided');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/oauth2/redirect/google`, // Full callback URL
    scope: ['profile', 'email']
}, async function verify(issuer, profile, cb) {
    try {
        const federatedCredential = await FederatedCredential.findOne({
            where: {
                provider: issuer,
                subject: profile.id
            }
        });

        if (!federatedCredential) {
            const registerResult = await authService.registerWithGoogle(issuer, profile);
            if (registerResult.error) {
                throw new Error(registerResult.error);
            }
            const user = registerResult.user;

            return cb(null, user);
        } else {
            const user = await User.findByPk(federatedCredential.user_id);
            if (!user) {
                return cb(null, false);
            }
            return cb(null, user);
        }
    } catch (err) {
        return cb(err);
    }
}));

module.exports = passport;