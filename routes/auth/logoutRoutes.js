/**
 * Logout Routes
 * Handles logout endpoint
 */

const express = require('express');
const router = express.Router();

const { logout } = require('../../controller/auth/logoutController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/', authenticate, logout);

module.exports = router;
