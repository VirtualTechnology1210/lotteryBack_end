/**
 * Get User Routes
 * Handles fetching users
 */

const express = require('express');
const router = express.Router();

const { getAllUsers, getUserById } = require('../../controller/user/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get('/:id', authenticate, requireAdmin, getUserById);

module.exports = router;
