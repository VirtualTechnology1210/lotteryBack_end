/**
 * Get Role Controller
 * Handles fetching roles
 */

const { Role } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Get all roles
 * @route GET /api/roles
 * @access Authenticated users
 */
const getAllRoles = async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['id', 'role', 'createdAt', 'updatedAt'],
            order: [['id', 'ASC']]
        });

        return sendSuccess(res, 'Roles fetched successfully', {
            count: roles.length,
            roles
        });

    } catch (error) {
        console.error('Get all roles error:', error);
        return sendError(res, 'An error occurred while fetching roles.');
    }
};

/**
 * Get single role by ID
 * @route GET /api/roles/:id
 * @access Authenticated users
 */
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findByPk(id, {
            attributes: ['id', 'role', 'createdAt', 'updatedAt']
        });

        if (!role) {
            return sendNotFound(res, 'Role');
        }

        return sendSuccess(res, 'Role fetched successfully', {
            role
        });

    } catch (error) {
        console.error('Get role by ID error:', error);
        return sendError(res, 'An error occurred while fetching role.');
    }
};

module.exports = {
    getAllRoles,
    getRoleById
};
