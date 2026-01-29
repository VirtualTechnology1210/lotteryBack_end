/**
 * Logout Controller
 * Handles user logout (client-side token removal)
 */

const { sendSuccess } = require('../../utils/responseUtils');

/**
 * Logout user
 * Since JWT is stateless, we just inform client to remove token
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // With JWT, logout is primarily handled client-side by removing the token
        // Server can optionally blacklist tokens (requires additional setup)

        return sendSuccess(res, 'Logout successful. Please remove your token.');

    } catch (error) {
        console.error('Logout error:', error);
        return sendSuccess(res, 'Logout successful');
    }
};

module.exports = {
    logout
};
