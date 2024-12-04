const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const userService = require('../../modules/user/services/user.services');
const bcrypt = require('bcrypt');
const User = require('../../modules/user/models/user')

passport.serializeUser(function(user, cb) { // store user in session
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username }); // store id and username in session
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

module.exports = passport;