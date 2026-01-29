/**
 * Delete Permission Controller
 * Handles deleting permissions (Admin only)
 */

const { Permission, Role, Page } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Delete permission by ID
 * @route DELETE /api/permissions/:id
 * @access Admin only
 */
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;

        // Find permission
        const permission = await Permission.findByPk(id, {
            include: [
                { model: Role, as: 'role', attributes: ['id', 'role'] },
                { model: Page, as: 'page', attributes: ['id', 'page'] }
            ]
        });

        if (!permission) {
            return sendNotFound(res, 'Permission');
        }

        // Store info for response
        const deletedInfo = {
            id: permission.id,
            role: permission.role ? permission.role.role : null,
            page: permission.page ? permission.page.page : null
        };

        // Delete permission
        await permission.destroy();

        return sendSuccess(res, 'Permission deleted successfully', {
            deletedPermission: deletedInfo
        });

    } catch (error) {
        console.error('Delete permission error:', error);
        return sendError(res, 'An error occurred while deleting permission.');
    }
};

/**
 * Delete all permissions for a role
 * @route DELETE /api/permissions/role/:roleId
 * @access Admin only
 */
const deletePermissionsByRole = async (req, res) => {
    try {
        const { roleId } = req.params;

        // Verify role exists
        const role = await Role.findByPk(roleId);
        if (!role) {
            return sendNotFound(res, 'Role');
        }

        // Delete all permissions for this role
        const deletedCount = await Permission.destroy({
            where: { role_id: roleId }
        });

        return sendSuccess(res, 'Permissions deleted successfully', {
            role: role.role,
            deletedCount
        });

    } catch (error) {
        console.error('Delete permissions by role error:', error);
        return sendError(res, 'An error occurred while deleting permissions.');
    }
};

module.exports = {
    deletePermission,
    deletePermissionsByRole
};
