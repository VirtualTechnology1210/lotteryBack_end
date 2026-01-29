/**
 * Login Controller
 * Handles user authentication and JWT token generation
 */

const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const { generateToken } = require('../../utils/jwtUtils');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');

/**
 * Login user and generate JWT token
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        const errors = [];
        if (!email || email.trim() === '') {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        if (!password || password.trim() === '') {
            errors.push({ field: 'password', message: 'Password is required' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase().trim() }
        });

        if (!user) {
            return sendError(res, 'Invalid email or password', 401);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return sendError(res, 'Invalid email or password', 401);
        }

        // Generate JWT token
        const token = generateToken(user);

        // Return success response with token and user info
        return sendSuccess(res, 'Login successful', {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return sendError(res, 'An error occurred during login. Please try again.');
    }
};

module.exports = {
    login
};
