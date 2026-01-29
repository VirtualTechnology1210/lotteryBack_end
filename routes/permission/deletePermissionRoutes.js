/**
 * Delete Permission Routes
 */

const express = require('express');
const router = express.Router();

const { deletePermission, deletePermissionsByRole } = require('../../controller/permission/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   DELETE /api/permissions/role/:roleId
 * @desc    Delete all permissions for a role
 * @access  Admin only
 */
router.delete('/role/:roleId', authenticate, requireAdmin, deletePermissionsByRole);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete permission by ID
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deletePermission);

module.exports = router;
