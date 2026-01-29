/**
 * Get Permission Routes
 */

const express = require('express');
const router = express.Router();

const { getAllPermissions, getPermissionsByRole, getMyPermissions } = require('../../controller/permission/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   GET /api/permissions/my
 * @desc    Get current user's permissions
 * @access  Authenticated users
 */
router.get('/my', authenticate, getMyPermissions);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, getAllPermissions);

/**
 * @route   GET /api/permissions/role/:roleId
 * @desc    Get permissions by role ID
 * @access  Admin only
 */
router.get('/role/:roleId', authenticate, requireAdmin, getPermissionsByRole);

module.exports = router;
