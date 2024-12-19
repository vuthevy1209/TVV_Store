// src/controllers/user.controller.js
const userService = require('../services/user.services');

class UserController {
    async updateProfile(req, res) {
        const { firstName, lastName } = req.body;
        const userId = req.user.id;

        try {
            if(req.file) {
                const avatarUrl = await userService.uploadAvatar(req.file);
                await userService.updateUserProfileWithAvatar(userId, firstName, lastName, avatarUrl);
            }
            else {
                await userService.updateUserProfile(userId, firstName, lastName);
            }

            res.status(200).json({ message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ message: 'An error occurred while updating the profile' });
        }
    }

    async getProfile(req, res) {
        try {
            const user = await userService.findById(req.user.id);
            return res.json({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                avatarUrl: user.avatar_url,
                email: user.email,
            });
        } catch (error) {
            console.error('Error getting profile:', error);
            res.status(500).json({ message: 'An error occurred while getting the profile' });
        }
    }
}


module.exports = new UserController();