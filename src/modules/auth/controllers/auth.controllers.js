const userService = require('../../user/services/user.services');
const passport = require('../../../config/auth/passport');

class AuthController {
    // [GET] /login
    showLoginForm(req, res) {
        res.render('auth/login', {
            layout: 'auth',
            title: 'Login',
            error: req.flash('error')
        });
    }

    // [POST] /login
    async login(req, res, next) {
        passport.authenticate('local', {
            successRedirect: req.session.returnTo || '/home',
            failureRedirect: '/auth/login',
            failureFlash: true // Enable flash messages for login failure
        })(req, res, next);
    }

    // [GET] /register
    showRegisterForm(req, res) {
        res.render('auth/register', { layout: 'auth', title: 'Register' });
    }

    // [POST] /register
    async register(req, res) {
        const result = await userService.createUser(req.body);;
        if(result.error) {
            return res.status(400).render('auth/register', {
                layout: 'auth',
                title: 'Register',
                fail: true,
                message: result.error,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                username: req.body.username,
                email: req.body.email
            });
        }
        res.redirect('/auth/login');
    }

    // [GET] /logout
    async logout(req, res, next) {
        try {
            await req.logout(function(err) {
                if (err) { return next(err); }
                res.redirect('/home');
            });
        } catch (error) {
            res.status(500).send('An error occurred');
        }
    }

    // [POST] /change-password
    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            const result = await userService.changePassword(userId, oldPassword, newPassword);
            if (result.error) {
                return res.status(400).send(result.error);
            }

            res.send('Password changed successfully');
        } catch (error) {
            console.log(error);
            return res.status(500).send('An error occurred');
        }
    }
}

module.exports = new AuthController();