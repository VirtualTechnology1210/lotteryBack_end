/**
 * Role-Based Access Control (RBAC) Middleware
 * Controls access based on user roles
 */

const { sendForbidden } = require('../utils/responseUtils');

/**
 * Check if user has required role
 * @param {Array} allowedRoles - Array of allowed role names (e.g., ['admin'])
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // User should be attached by auth middleware
            if (!req.user) {
                return sendForbidden(res, 'Access denied. User not authenticated.');
            }

            // Check if user's role is in allowed roles
            if (!req.user.role || !allowedRoles.includes(req.user.role)) {
                return sendForbidden(res, `Access denied. Required role: ${allowedRoles.join(' or ')}`);
            }

            next();
        } catch (error) {
            console.error('RBAC middleware error:', error);
            return sendForbidden(res, 'Access denied.');
        }
    };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole(['admin']);

/**
 * Require user role (or higher)
 */
const requireUser = requireRole(['admin', 'user']);

module.exports = {
    requireRole,
    requireAdmin,
    requireUser
};
