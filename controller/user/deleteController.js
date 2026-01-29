/**
 * Delete User Controller
 * Handles deleting users (Admin only)
 */

const { User } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Delete user by ID
 * @route DELETE /api/users/:id
 * @access Admin only
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        // Prevent admin from deleting themselves
        if (parseInt(id) === currentUserId) {
            return sendError(res, 'You cannot delete your own account', 400);
        }

        // Find user
        const user = await User.findByPk(id);

        if (!user) {
            return sendNotFound(res, 'User');
        }

        // Store user info for response
        const deletedUserInfo = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        // Delete user
        await user.destroy();

        return sendSuccess(res, 'User deleted successfully', {
            deletedUser: deletedUserInfo
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return sendError(res, 'An error occurred while deleting user.');
    }
};

module.exports = {
    deleteUser
};
