/**
 * Get User Controller
 * Handles fetching users (Admin only)
 */

const { User, Role } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Get all users
 * @route GET /api/users
 * @access Admin only
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role_id', 'created_at', 'updated_at'],
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'role']
            }],
            order: [['created_at', 'DESC']]
        });

        return sendSuccess(res, 'Users fetched successfully', {
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Get all users error:', error);
        return sendError(res, 'An error occurred while fetching users.');
    }
};

/**
 * Get single user by ID
 * @route GET /api/users/:id
 * @access Admin only
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role_id', 'created_at', 'updated_at'],
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'role']
            }]
        });

        if (!user) {
            return sendNotFound(res, 'User');
        }

        return sendSuccess(res, 'User fetched successfully', {
            user
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        return sendError(res, 'An error occurred while fetching user.');
    }
};

module.exports = {
    getAllUsers,
    getUserById
};
