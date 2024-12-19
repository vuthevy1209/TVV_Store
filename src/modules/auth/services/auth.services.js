const userService = require('../../user/services/user.services');
const customerService = require('../../customer/services/customer.services');
const cartService = require('../../cart/services/cart.services');
const FederatedCredential = require('../models/federatedCredential');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const VerifyToken = require('../models/verifyToken');
const brevoHelper = require('../../../helpers/brevo.helpers');
const User = require('../../user/models/user');
const ResetPasswordVerifyToken = require('../models/resetPasswordVerifyToken');
const { Op } = require('sequelize');


const {sequelize} = require('../../../config/database'); // Adjust the path to your database configuration

class AuthService {
    async createUserWithDependencies(userData) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const result = await userService.createUser(userData, {transaction});

                const user = result.user;
                const customerResult = await customerService.createCustomerBasedOnExistingUser(user.id, {transaction});

                const customer = customerResult.customer;
                const cartResult = await cartService.createCart(customer.id, {transaction});

                return {user, customer, cart: cartResult.cart};
            });
        } catch (error) {
            console.error('Error registering user:', error);
            throw new Error(error.message);
        }
    }

    async register(userData) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const registerResult = await this.createUserWithDependencies(userData);

                if (registerResult.error) {
                    throw new Error(registerResult.error);
                }

                // Send verification email
                const token = crypto.randomBytes(32).toString('hex');
                const verificationToken = await VerifyToken.create({
                    user_id: registerResult.user.id,
                    token: token // Assume you have a function to generate a token
                }, {transaction});

                // Dynamically determine the base URL
                const BASE_URL = process.env.NODE_ENV === 'production'
                    ? process.env.PROD_BASE_URL // Production URL
                    : process.env.DEV_BASE_URL;

                const confirmationLink = `${BASE_URL}/auth/verify?token=${verificationToken.token}`;
                await brevoHelper.sendAccountConfirmationEmail(registerResult.user.email, registerResult.user.first_name, confirmationLink); // Assume you have a function to send email

                return {user: registerResult.user, customer: registerResult.customer, cart: registerResult.cart};
            });
        } catch (error) {
            console.error('Error registering user:', error);
            throw new Error(error.message);
        }
    }

    async verifyUser(token) {
        try {
            const verifyToken = await VerifyToken.findOne({where: {token}});

            if (!verifyToken) {
                throw new Error('Invalid or expired verification token');
            }

            await VerifyToken.destroy({where: {id: verifyToken.id}});

            return {message: 'Your account has been verified successfully!'};
        } catch (error) {
            console.error('Error verifying user:', error);
            throw new Error(error.message);
        }
    }

    async registerWithGoogle(issuer, profile) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const hashedPassword = await bcrypt.hash('default_password', 10); // Hash the default password

                const userData = {
                    username: profile.id,
                    password: hashedPassword,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    email: profile.emails[0].value
                };

                const registerResult = await this.createUserWithDependencies(userData);
                if (registerResult.error) {
                    throw new Error(registerResult.error);
                }

                const user = registerResult.user;

                await FederatedCredential.create({
                    user_id: user.id,
                    provider: issuer,
                    subject: profile.id
                }, {transaction});

                return {user, customer: registerResult.customer, cart: registerResult.cart};
            });
        } catch (error) {
            console.error('Error registering user with Google:', error);
            throw new Error('An error occurred during Google registration');
        }
    }

    async forgotPassword(email) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const user = await User.findOne({where: {email}});
                if (!user) {
                    throw new Error('User not found');
                }

                const token = crypto.randomBytes(32).toString('hex');
                await ResetPasswordVerifyToken.create({user_id: user.id, token}, {transaction});

                // Dynamically determine the base URL
                const BASE_URL = process.env.NODE_ENV === 'production'
                    ? process.env.PROD_BASE_URL // Production URL
                    : process.env.DEV_BASE_URL;

                const confirmationUrl = `${BASE_URL}/auth/confirm-reset-password?token=${token}`;
                await brevoHelper.sendResetPasswordConfirmationEmail(user.email, user.first_name, confirmationUrl); // Assume you have a function to send email
            });
        } catch (error) {
            console.error('Error in send reset password confirmation email:', error);
            throw new Error(error.message);
        }
    }

    async verifyResetPassword(token) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const resetPasswordToken = await ResetPasswordVerifyToken.findOne({
                    where: {
                        token,
                        created_at: {
                            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Token expires in 1 hour
                        }
                    }
                });

                if (!resetPasswordToken) {
                    throw new Error('Invalid or expired reset password token');
                }

                const user = await User.findByPk(resetPasswordToken.user_id);
                if (!user) {
                    throw new Error('User not found');
                }

                const newPassword = crypto.randomBytes(8).toString('hex');
                await userService.updateUserPassword(user.id, newPassword, transaction);

                await ResetPasswordVerifyToken.destroy({where: {id: resetPasswordToken.id}}, {transaction});
                await brevoHelper.sendForgotPasswordEmail(user.email, user.first_name, user.username, newPassword);
            });
        } catch (error) {
            console.error('Error in verify reset password:', error);
            throw new Error(error.message);
        }
    }
}

module.exports = new AuthService();