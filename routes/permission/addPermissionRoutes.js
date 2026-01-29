/**
 * Add Permission Routes
 */

const express = require('express');
const router = express.Router();

const { addOrUpdatePermission, bulkUpdatePermissions } = require('../../controller/permission/addController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   POST /api/permissions
 * @desc    Create or update a permission
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, addOrUpdatePermission);

/**
 * @route   POST /api/permissions/bulk
 * @desc    Bulk update permissions for a role
 * @access  Admin only
 */
router.post('/bulk', authenticate, requireAdmin, bulkUpdatePermissions);

module.exports = router;
