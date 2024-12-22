const { body, validationResult } = require('express-validator');

const PaymentTypeEnums = require('../modules/payment/enums/payment.enums');

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
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
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

const validateShipmentAndCardDetails = [
    body('shippingDetails.fullname').notEmpty().withMessage('Full name is required'),
    body('shippingDetails.phone')
        .notEmpty().withMessage('Phone number is required')
        .isMobilePhone('any', { strictMode: true }).withMessage('Invalid phone number'),
    body('shippingDetails.address').notEmpty().withMessage('Address is required'),
    body('shippingDetails.district').notEmpty().withMessage('District is required'),
    body('shippingDetails.province').notEmpty().withMessage('Province is required'),
    body('paymentType').notEmpty().withMessage('Payment type is required'),
    (req, res, next) => {
        if (req.body.paymentType === PaymentTypeEnums.VNPAY) {
            body('cardDetails.card_number')
                .notEmpty().withMessage('Card number is required')
                .isCreditCard().withMessage('Invalid card number')(req, res, next);
            body('cardDetails.card_holder_name').notEmpty().withMessage('Card holder name is required')(req, res, next);
            body('cardDetails.card_expiry_month').notEmpty().withMessage('Expiry month is required')(req, res, next);
            body('cardDetails.card_expiry_year').notEmpty().withMessage('Expiry year is required')(req, res, next);
            body('cardDetails.card_cvv').notEmpty().withMessage('CVV is required')(req, res, next);
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
        next();
    }
];

module.exports = {
    validateRegistration, validateShipmentAndCardDetails
};