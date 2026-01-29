/**
 * Delete User Routes
 * Handles deleting users
 */

const express = require('express');
const router = express.Router();

const { deleteUser } = require('../../controller/user/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteUser);

module.exports = router;
