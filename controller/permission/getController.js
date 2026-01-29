/**
 * Get Permission Controller
 * Handles fetching permissions (Admin only)
 */

const { Permission, Role, Page } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Get all permissions
 * @route GET /api/permissions
 * @access Admin only
 */
const getAllPermissions = async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            include: [
                { model: Role, as: 'role', attributes: ['id', 'role'] },
                { model: Page, as: 'page', attributes: ['id', 'page'] }
            ],
            order: [['role_id', 'ASC'], ['page_id', 'ASC']]
        });

        return sendSuccess(res, 'Permissions fetched successfully', {
            count: permissions.length,
            permissions
        });

    } catch (error) {
        console.error('Get all permissions error:', error);
        return sendError(res, 'An error occurred while fetching permissions.');
    }
};

/**
 * Get permissions by role ID
 * @route GET /api/permissions/role/:roleId
 * @access Admin only
 */
const getPermissionsByRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        // Verify role exists
        const role = await Role.findByPk(roleId);
        if (!role) {
            return sendNotFound(res, 'Role');
        }

        const permissions = await Permission.findAll({
            where: { role_id: roleId },
            include: [
                { model: Page, as: 'page', attributes: ['id', 'page'] }
            ],
            order: [['page_id', 'ASC']]
        });

        return sendSuccess(res, 'Permissions fetched successfully', {
            role: {
                id: role.id,
                role: role.role
            },
            count: permissions.length,
            permissions
        });

    } catch (error) {
        console.error('Get permissions by role error:', error);
        return sendError(res, 'An error occurred while fetching permissions.');
    }
};

/**
 * Get permissions for current user's role
 * @route GET /api/permissions/my
 * @access Authenticated users
 */
const getMyPermissions = async (req, res) => {
    try {
        const roleId = req.user.role_id;

        const permissions = await Permission.findAll({
            where: { role_id: roleId },
            include: [
                { model: Page, as: 'page', attributes: ['id', 'page'] }
            ],
            order: [['page_id', 'ASC']]
        });

        // Transform to a simpler format for mobile app
        const permissionMap = {};
        permissions.forEach(perm => {
            permissionMap[perm.page.page] = {
                view: perm.view === 1,
                add: perm.add === 1,
                edit: perm.edit === 1,
                del: perm.del === 1
            };
        });

        return sendSuccess(res, 'Permissions fetched successfully', {
            role: req.user.role,
            permissions: permissionMap
        });

    } catch (error) {
        console.error('Get my permissions error:', error);
        return sendError(res, 'An error occurred while fetching permissions.');
    }
};

module.exports = {
    getAllPermissions,
    getPermissionsByRole,
    getMyPermissions
};
