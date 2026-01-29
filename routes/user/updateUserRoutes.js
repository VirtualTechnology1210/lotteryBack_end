/**
 * Update User Routes
 * Handles updating users
 */

const express = require('express');
const router = express.Router();

const { updateUser } = require('../../controller/user/updateController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Admin only
 */
router.put('/:id', authenticate, requireAdmin, updateUser);

module.exports = router;
