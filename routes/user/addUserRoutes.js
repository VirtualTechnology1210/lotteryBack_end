/**
 * Add User Routes
 * Handles creating new users
 */

const express = require('express');
const router = express.Router();

const { addUser } = require('../../controller/user/addController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, addUser);

module.exports = router;
