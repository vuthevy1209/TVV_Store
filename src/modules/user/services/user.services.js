const bcrypt = require('bcrypt');
const User = require('../models/user');

class UserServices {
    // find user by username
    async findByUsername(username) {
        try {
            return await User.findOne({ where: { username } });
        } catch (error) {
            return { error: error.message };
        }
    }

    // compare password
    async validatePassword(inputPassword, storedPassword) {
        try {
            return await bcrypt.compare(inputPassword, storedPassword);
        } catch (error) {
            return { error: error.message };
        }
    }

    // create a new user
    async createUser(userData) {
        try {
            const { username, password, email, first_name, last_name } = userData;
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            return await User.create({
                username,
                email,
                password: hashedPassword,
                first_name,
                last_name,
            });
        } catch (error) {
            return { error: error.message };
        }
    }

    // find user by id
    async findById(id) {
        try {
            return await User.findByPk(id);
        } catch (error) {
            return { error: error.message };
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
            return { error: error.message };
        }
    }

    // change password
    async changePassword(id, oldPassword, newPassword) {
        try {
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
            return await user.update({ password: hashedPassword });
        } catch (error) {
            return { error: error.message };
        }
    }

    // get all users
    async getAllUsers() {
        try {
            return await User.findAll();
        } catch (error) {
            return { error: error.message };
        }
    }

    // delete user
    async deleteUser(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('User not found');
            }
            return await user.destroy();
        } catch (error) {
            return { error: error.message };
        }
    }

    // ban user
    async banUser(id) {
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('User not found');
            }
            return await user.update({ status: false });
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new UserServices();