/**
 * Add/Update Permission Controller
 * Handles creating or updating permissions for roles (Admin only)
 */

const { Permission, Role, Page } = require('../../models');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Create or update permission for a role-page combination
 * @route POST /api/permissions
 * @access Admin only
 */
const addOrUpdatePermission = async (req, res) => {
    try {
        const { role_id, page_id, view, add, edit, del } = req.body;

        // Validate required fields
        const errors = [];
        if (!role_id) {
            errors.push({ field: 'role_id', message: 'Role ID is required' });
        }
        if (!page_id) {
            errors.push({ field: 'page_id', message: 'Page ID is required' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Verify role exists
        const role = await Role.findByPk(role_id);
        if (!role) {
            return sendNotFound(res, 'Role');
        }

        // Verify page exists
        const page = await Page.findByPk(page_id);
        if (!page) {
            return sendNotFound(res, 'Page');
        }

        // Check if permission already exists
        let permission = await Permission.findOne({
            where: { role_id, page_id }
        });

        const permissionData = {
            role_id,
            page_id,
            view: view ? 1 : 0,
            add: add ? 1 : 0,
            edit: edit ? 1 : 0,
            del: del ? 1 : 0
        };

        if (permission) {
            // Update existing permission
            await permission.update(permissionData);

            // Reload with associations
            permission = await Permission.findByPk(permission.id, {
                include: [
                    { model: Role, as: 'role', attributes: ['id', 'role'] },
                    { model: Page, as: 'page', attributes: ['id', 'page'] }
                ]
            });

            return sendSuccess(res, 'Permission updated successfully', {
                permission
            });
        } else {
            // Create new permission
            const newPermission = await Permission.create(permissionData);

            // Fetch with associations
            const createdPermission = await Permission.findByPk(newPermission.id, {
                include: [
                    { model: Role, as: 'role', attributes: ['id', 'role'] },
                    { model: Page, as: 'page', attributes: ['id', 'page'] }
                ]
            });

            return sendSuccess(res, 'Permission created successfully', {
                permission: createdPermission
            }, 201);
        }

    } catch (error) {
        console.error('Add/Update permission error:', error);
        return sendError(res, 'An error occurred while managing permission.');
    }
};

/**
 * Bulk update permissions for a role
 * @route POST /api/permissions/bulk
 * @access Admin only
 */
const bulkUpdatePermissions = async (req, res) => {
    try {
        const { role_id, permissions } = req.body;

        // Validate
        if (!role_id) {
            return sendValidationError(res, [{ field: 'role_id', message: 'Role ID is required' }]);
        }

        if (!permissions || !Array.isArray(permissions)) {
            return sendValidationError(res, [{ field: 'permissions', message: 'Permissions array is required' }]);
        }

        // Verify role exists
        const role = await Role.findByPk(role_id);
        if (!role) {
            return sendNotFound(res, 'Role');
        }

        const results = [];

        for (const perm of permissions) {
            const { page_id, view, add, edit, del } = perm;

            if (!page_id) continue;

            // Verify page exists
            const page = await Page.findByPk(page_id);
            if (!page) continue;

            const permissionData = {
                role_id,
                page_id,
                view: view ? 1 : 0,
                add: add ? 1 : 0,
                edit: edit ? 1 : 0,
                del: del ? 1 : 0
            };

            // Upsert permission
            const [permission, created] = await Permission.findOrCreate({
                where: { role_id, page_id },
                defaults: permissionData
            });

            if (!created) {
                await permission.update(permissionData);
            }

            results.push({
                page_id,
                page: page.page,
                status: created ? 'created' : 'updated'
            });
        }

        return sendSuccess(res, 'Permissions updated successfully', {
            role_id,
            role: role.role,
            updated: results.length,
            results
        });

    } catch (error) {
        console.error('Bulk update permissions error:', error);
        return sendError(res, 'An error occurred while updating permissions.');
    }
};

module.exports = {
    addOrUpdatePermission,
    bulkUpdatePermissions
};
