/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const { verifyToken, extractToken } = require('../utils/jwtUtils');
const { sendUnauthorized } = require('../utils/responseUtils');
const { User, Role } = require('../models');

/**
 * Authenticate user via JWT token
 * Attaches decoded user info to req.user including role
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = extractToken(req.headers.authorization);

        if (!token) {
            return sendUnauthorized(res, 'No token provided. Please login to access this resource.');
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return sendUnauthorized(res, 'Invalid or expired token. Please login again.');
        }

        // Find user in database with their role
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'email', 'role_id'],
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'role']
            }]
        });

        if (!user) {
            return sendUnauthorized(res, 'User not found. Please login again.');
        }

        // Attach user to request object with role
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role: user.role ? user.role.role : null
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return sendUnauthorized(res, 'Authentication failed. Please login again.');
    }
};

module.exports = {
    authenticate
};

