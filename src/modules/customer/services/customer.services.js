const User = require('../../user/models/user');
const Customer = require('../models/customer');

class CustomerService {
    async getByUserId(userId) {
        return await Customer.findOne({ where: { user_id: userId } });
    }

    async createCustomerBasedOnExistingUser(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const existingCustomer = await this.getByUserId(userId);
            if (existingCustomer) {
                throw new Error('Customer already exists for this user');
            }

            const customer = await Customer.create({ user_id: userId });
            return {customer};
        } catch (error) {
            console.error('Error creating customer:', error);
            throw new Error('Internal Server Error');
        }
    }
}

module.exports = new CustomerService();