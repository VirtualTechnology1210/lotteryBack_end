/**
 * Permission Middleware
 * Checks page-based permissions for users based on their role
 */

const { Permission, Page } = require('../models');
const { sendForbidden, sendError } = require('../utils/responseUtils');

/**
 * Check if user has specific permission on a page
 * @param {string} pageName - Name of the page (e.g., 'Products', 'Categories')
 * @param {string} action - Action type: 'view', 'add', 'edit', 'del'
 */
const checkPermission = (pageName, action) => {
    return async (req, res, next) => {
        try {
            // User should be attached by auth middleware
            if (!req.user) {
                return sendForbidden(res, 'Access denied. User not authenticated.');
            }

            // Admin has full access to everything
            if (req.user.role === 'admin') {
                return next();
            }

            // Get the page by name
            const page = await Page.findOne({
                where: { page: pageName }
            });

            if (!page) {
                console.error(`Page not found: ${pageName}`);
                return sendError(res, 'Page configuration not found.', 500);
            }

            // Get permission for user's role on this page
            const permission = await Permission.findOne({
                where: {
                    role_id: req.user.role_id,
                    page_id: page.id
                }
            });

            if (!permission) {
                return sendForbidden(res, `Access denied. No permissions configured for ${pageName}.`);
            }

            // Check if the specific action is allowed
            const actionValue = permission[action];

            if (!actionValue || actionValue !== 1) {
                const actionLabel = {
                    view: 'view',
                    add: 'add',
                    edit: 'edit',
                    del: 'delete'
                }[action] || action;

                return sendForbidden(res, `Access denied. You don't have permission to ${actionLabel} ${pageName.toLowerCase()}.`);
            }

            next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            return sendError(res, 'Error checking permissions.');
        }
    };
};

/**
 * Check if user has view permission on a page
 */
const canView = (pageName) => checkPermission(pageName, 'view');

/**
 * Check if user has add permission on a page
 */
const canAdd = (pageName) => checkPermission(pageName, 'add');

/**
 * Check if user has edit permission on a page
 */
const canEdit = (pageName) => checkPermission(pageName, 'edit');

/**
 * Check if user has delete permission on a page
 */
const canDelete = (pageName) => checkPermission(pageName, 'del');

module.exports = {
    checkPermission,
    canView,
    canAdd,
    canEdit,
    canDelete
};
