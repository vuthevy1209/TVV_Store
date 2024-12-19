const { body, validationResult } = require('express-validator');

const validateRegistration = [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email').notEmpty().withMessage('Email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/)
        .withMessage('Password must contain at least one number'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({message: errors.array()[0].msg});
        }


        // if (!errors.isEmpty()) {
        //     return res.status(400).render('auth/login-register', {
        //         layout: 'auth',
        //         title: 'Register',
        //         fail: true,
        //         message: errors.array()[0].msg,
        //         firstName: req.body.firstName,
        //         lastName: req.body.lastName,
        //         username: req.body.username,
        //         email: req.body.email,
        //         password: req.body.password,
        //         confirmPassword: req.body.confirmPassword
        //     });
        // }
        next();
    }
];

const validatePassword = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('New password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('New password must contain at least one uppercase letter')
        .matches(/\d/)
        .withMessage('New password must contain at least one number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
        next();
    }
];

module.exports = {
    validatePassword, validateRegistration
};
