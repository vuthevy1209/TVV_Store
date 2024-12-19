const passport = require('../../../config/auth/passport');
const authService = require('../services/auth.services');
const VerifyToken = require('../models/VerifyToken');
const userService = require('../../user/services/user.services');

class AuthController {
    // [GET] /login
    showLoginForm(req, res) {
        res.render('auth/login-register', {
            layout: 'auth',
            title: 'Login',
        });
    }

    // [POST] /login
    async login(req, res, next) {
        passport.authenticate('local', async (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(400).json({message: 'Invalid username or password!'});
            }

            // Check if the user has a valid verification token
            const verifyToken = await VerifyToken.findOne({where: {user_id: user.id}});
            if (verifyToken) {
                return res.status(400).json({message: 'Please verify your email before logging in.'});
            }

            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                req.flash('success', 'Login successful!');
                // we hanle the response manually on the client, so we have to send the redirect URL as json to
                // avoid the automatic request of the client.
                res.json({redirectUrl: req.session.returnTo || '/home'});
            });
        })(req, res, next);
    }

    // [POST] /register
    async register(req, res) {
        try {
            const result = await authService.register(req.body);

            req.flash('success', 'Please check your inbox and log in after confirming your account.');
            res.json({redirectUrl: '/auth/login-register'});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    }

    // [GET] /logout
    async logout(req, res, next) {
        try {
            await req.logout(function (err) {
                if (err) {
                    return next(err);
                }
                req.flash('success', 'Logout successfully!')
                res.redirect('/home');
            });
        } catch (error) {
            res.status(500).send('An error occurred!');
        }
    }

    // [POST] /change-password
    async changePassword(req, res) {
        try {
            const {currentPassword, newPassword} = req.body;
            const userId = req.user.id;

            const result = await userService.changePassword(userId, currentPassword, newPassword);
            if (result.error) {
                return res.status(400).json({message: result.error});
            }

            res.json({message: 'Password changed successfully!'});
        } catch (error) {
            console.log(error);
            return res.status(500).json({message: 'An error occurred, please try again!'});
        }
    }

    // [GET] /verify
    async verifyUser(req, res, next) {
        try {
            const {token} = req.query;
            const result = await authService.verifyUser(token);

            req.flash('success', result.message);
            res.redirect('/auth/login-register');
        } catch (error) {
            console.error('Error verifying user:', error);
            req.flash('error', error.message);
            res.redirect('/auth/login-register');
        }
    }

    // [POST] /forgot-password
    async forgotPassword(req, res) {
        try {
            const {email} = req.body;
            await authService.forgotPassword(email);
            res.json({message: 'A confirmation email has been sent to your email.\nPlease confirm to proceed with resetting your password.'});
        } catch (error) {
            console.error('Error in forgot password:', error);
            res.status(500).json({message: error.message + '\nPlease try again!'});
        }
    }

    // [GET] /confirm-reset-password
    async confirmResetPassword(req, res) {
        try {
            const {token} = req.query;
            await authService.verifyResetPassword(token);
            req.flash('success', 'A reset password email has been sent to your email. Please check your email to reset your password.');
            res.redirect('/auth/login-register');
        } catch (error) {
            console.error('Error in confirm reset password:', error);
            req.flash('error', error.message);
            res.redirect('/auth/login-register');
        }
    }

}

module.exports = new AuthController();