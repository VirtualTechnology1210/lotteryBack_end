/**
 * Profile Routes
 * Handles profile endpoint
 */

const express = require('express');
const router = express.Router();

const { getProfile } = require('../../controller/auth/profileController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   GET /api/auth/profile
 * @desc    Get authenticated user's profile
 * @access  Private
 */
router.get('/', authenticate, getProfile);

module.exports = router;
