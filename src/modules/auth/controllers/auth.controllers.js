const passport = require('../../../config/auth/passport');
const authService = require('../services/auth.services');
const cartService = require('../../cart/services/cart.services');

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
        // Save the cart data before logging in
//        const cartData = req.session.cart.items || {};
        let cartData = {};
        if(req.session.cart){
            cartData = req.session.cart.items;
        }
        
        passport.authenticate('local',async (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(400).json({message: 'Invalid username or password!'});
            }
            req.logIn(user, async (err) => {
                if (err) {
                    return next(err);
                }
                await cartService.mergeCarts(user.id, cartData);
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
            if (result.error) {
                return res.status(400).json({message: result.error});
            }
            req.flash('success', 'Register successfully, please login!');
            
            res.json({redirectUrl: '/auth/login-register'});
        } catch (error) {
            res.status(500).json({message: 'An error occurred. Please try again.'});
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
            const {oldPassword, newPassword} = req.body;
            const userId = req.user.id;

            const result = await userService.changePassword(userId, oldPassword, newPassword);
            if (result.error) {
                return res.status(400).send(result.error);
            }

            res.send('Password changed successfully!');
        } catch (error) {
            console.log(error);
            return res.status(500).send('An error occurred');
        }
    }
}

module.exports = new AuthController();