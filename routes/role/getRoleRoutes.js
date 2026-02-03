/**
 * Get Role Routes
 */

const express = require('express');
const router = express.Router();

const { getAllRoles, getRoleById } = require('../../controller/role/getController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Authenticated users
 */
router.get('/', authenticate, getAllRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Authenticated users
 */
router.get('/:id', authenticate, getRoleById);

module.exports = router;
