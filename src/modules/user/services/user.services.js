const bcrypt = require('bcrypt');
const User = require('../models/user');
const { sequelize } = require('../../../config/database'); // Adjust the path to your database configuration


class UserServices {
    // find user by username
    async findByUsername(username) {
        try {
            return await User.findOne({where: {username}});
        } catch (error) {
            return {error: error.message};
        }
    }

    // compare password
    async validatePassword(inputPassword, storedPassword) {
        try {
            return await bcrypt.compare(inputPassword, storedPassword);
        } catch (error) {
            return {error: error.message};
        }
    }

    // create a new user
    async createUser(userData) {
        try {
            const {username, password, email, firstName, lastName} = userData;

            // Check if username is already taken
            const existingUserByUsername = await User.findOne({where: {username}});
            if (existingUserByUsername) {
                throw new Error('Username is already taken');
            }

            // Check if email is already taken
            const existingUserByEmail = await User.findOne({where: {email}});
            if (existingUserByEmail) {
                throw new Error('Email is already taken');
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const user = await User.create({
                username,
                email,
                password: hashedPassword,
                first_name: firstName,
                last_name: lastName,
            });

            return {user};
        } catch (error) {
            // return { error: error.message };
            throw new Error(error.message);
        }

    }

    // find user by id
    async findById(id) {
        try {
            return await User.findByPk(id);
        } catch (error) {
            return {error: error.message};
        }
    }

    // update user
    async updateUser(id, updates) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('User not found');
            }
            return await user.update(updates);
        } catch (error) {
            return {error: error.message};
        }
    }

    // change password
    async changePassword(id, oldPassword, newPassword) {
        try {
            return await sequelize.transaction(async (transaction) => {
                const user = await this.findById(id);
                if (!user) {
                    throw new Error('User not found');
                }

                const isMatch = await bcrypt.compare(oldPassword, user.password);
                if (!isMatch) {
                    throw new Error('Old password is incorrect');
                }

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
                return await user.update({ password: hashedPassword }, { transaction });
            });
        } catch (error) {
            return {error: error.message};
        }
    }

    // update user password
    async updateUserPassword(userId, newPassword) {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.update({password: hashedPassword}, {where: {id: userId}});
        }
        catch(error) {
            console.log(error);
            throw new Error('Error updating password');
        }

    };
}

module.exports = new UserServices();