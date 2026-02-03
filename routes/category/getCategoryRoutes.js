/**
 * Get Category Routes
 */

const express = require('express');
const router = express.Router();

const { getAllCategories, getCategoryById, getActiveCategories } = require('../../controller/category/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { canView } = require('../../middleware/permissionMiddleware');

/**
 * @route   GET /api/categories/active
 * @desc    Get active categories for mobile app
 * @access  Authenticated users with view permission
 */
router.get('/active', authenticate, canView('Categories'), getActiveCategories);

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Users with view permission
 */
router.get('/', authenticate, canView('Categories'), getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Users with view permission
 */
router.get('/:id', authenticate, canView('Categories'), getCategoryById);

module.exports = router;
