/**
 * Login Routes
 * Handles login endpoint
 */

const express = require('express');
const router = express.Router();

const { login } = require('../../controller/auth/loginController');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get JWT token
 * @access  Public
 */
router.post('/', login);

module.exports = router;
