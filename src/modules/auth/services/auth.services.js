const userService = require('../../user/services/user.services');
const customerService = require('../../customer/services/customer.services');
const cartService = require('../../cart/services/cart.services');
const FederatedCredential = require('../models/federatedCredential');
const bcrypt = require('bcrypt');

const { sequelize } = require('../../../config/database'); // Adjust the path to your database configuration

class AuthService {
    async register(userData) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const result = await userService.createUser(userData, { transaction });
                if (result.error) {
                    throw new Error(`Failed to create user: ${result.error}`);
                }

                const user = result.user;
                const customerResult = await customerService.createCustomerBasedOnExistingUser(user.id, { transaction });
                if (customerResult.error) {
                    throw new Error(`Failed to create customer: ${customerResult.error}`);
                }

                const customer = customerResult.customer;
                const cartResult = await cartService.createCart(customer.id, { transaction });
                if (cartResult.error) {
                    throw new Error(`Failed to create cart: ${cartResult.error}`);
                }

                return { user, customer, cart: cartResult.cart };
            });
        } catch (error) {
            console.error('Error registering user:', error);
            throw new Error('An error occurred during registration');
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

                const registerResult = await this.register(userData);
                if (registerResult.error) {
                    throw new Error(registerResult.error);
                }

                const user = registerResult.user;

                await FederatedCredential.create({
                    user_id: user.id,
                    provider: issuer,
                    subject: profile.id
                }, { transaction });

                return { user, customer: registerResult.customer, cart: registerResult.cart };
            });
        } catch (error) {
            console.error('Error registering user with Google:', error);
            throw new Error('An error occurred during Google registration');
        }
    }
}

module.exports = new AuthService();