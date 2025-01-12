const passport = require('../../../config/auth/passport');
const authService = require('../services/auth.services');
const cartService = require('../../cart/services/cart.services');
const VerifyToken = require('../models/verifyToken');
const userService = require('../../user/services/user.services');

class AuthController {
    // [GET] /login
    showLoginForm(req, res) {
        const returnTo = req.query.returnTo;
        if (returnTo) {
            req.session.returnTo = returnTo;
        }
        res.render('auth/login-register', {
            layout: 'auth',
            title: 'Login',
        });
    }

    // [POST] /login
    async login(req, res, next) {
        // Save the cart data before logging in
        let cartData = {};
        if (req.session.cart) {
            cartData = req.session.cart.items;
        }
        const returnTo = req.session.returnTo || '/home';

        passport.authenticate('local', {keepSessionInfo: true}, async (err, user, info) => {
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

            if(user.status === false) {
                return res.status(400).json({message: 'Your account has been suspended by the administrator. For further details, please contact us at lctvuthqb@gmail.com.'});
            }

            req.logIn(user, async (err) => {
                if (err) {
                    return next(err);
                }

                try {
                    // Merge carts after successful login
                    await cartService.mergeCarts(user.id, cartData);
                } catch (mergeErr) {
                    console.error('Error merging carts:', mergeErr);
                    req.flash('error', 'Could not merge cart data.');
                }


                req.flash('success', 'Login successful!');
                // we handle the response manually on the client, so we have to send the redirect URL as json to
                // avoid the automatic request of the client.
                res.json({redirectUrl: returnTo || '/home'});
            });
        })(req, res, next);
    }

    async googleCallback(req, res, next) {
        // Save the cart data before logging in
        let cartData = {};
        if (req.session.cart) {
            cartData = req.session.cart.items;
        }
        const returnTo = req.session.returnTo || '/home';

        passport.authenticate('google', { keepSessionInfo: true }, async (err, user, info) => {
            if (err) {
                return next(err); // Handle any errors during authentication
            }
            if (!user) {
                // Handle case where user is not authenticated
                req.flash('error', 'Authentication failed!');
                return res.redirect('/auth/login-register');
            }

            req.logIn(user, async (err) => {
                if (err) {
                    return next(err); // Handle login errors
                }

                try {
                    // Merge carts after successful login
                    await cartService.mergeCarts(user.id, cartData);
                } catch (mergeErr) {
                    console.error('Error merging carts:', mergeErr);
                    req.flash('error', 'Could not merge cart data.');
                }

                // Redirect to the returnTo URL or default to /home
                req.session.returnTo = null; // Clear returnTo after redirecting
                req.flash('success', 'Login successful!');
                res.redirect(returnTo);
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
                req.flash('success', 'Logout successfully!');
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