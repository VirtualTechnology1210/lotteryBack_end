/**
 * Get Page Routes
 */

const express = require('express');
const router = express.Router();

const { getAllPages, getPageById } = require('../../controller/page/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   GET /api/pages
 * @desc    Get all pages
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, getAllPages);

/**
 * @route   GET /api/pages/:id
 * @desc    Get page by ID
 * @access  Admin only
 */
router.get('/:id', authenticate, requireAdmin, getPageById);

module.exports = router;
