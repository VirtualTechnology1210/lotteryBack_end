/**
 * Get Category Routes
 */

const express = require('express');
const router = express.Router();

const { getAllCategories, getCategoryById, getActiveCategories } = require('../../controller/category/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   GET /api/categories/active
 * @desc    Get active categories for mobile app
 * @access  Authenticated users
 */
router.get('/active', authenticate, getActiveCategories);

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Admin only
 */
router.get('/:id', authenticate, requireAdmin, getCategoryById);

module.exports = router;
