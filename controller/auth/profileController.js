/**
 * Profile Controller
 * Handles fetching authenticated user's profile
 */

const { User } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Get current user profile
 * @route GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    try {
        // User is already attached by auth middleware
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'created_at', 'updated_at']
        });

        if (!user) {
            return sendNotFound(res, 'User');
        }

        return sendSuccess(res, 'Profile fetched successfully', {
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return sendError(res, 'An error occurred while fetching profile.');
    }
};

module.exports = {
    getProfile
};
