/**
 * Add Category Routes
 */

const express = require('express');
const router = express.Router();

const { addCategory } = require('../../controller/category/addController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');
const { uploadCategory, handleMulterError } = require('../../config/multerConfig');

/**
 * @route   POST /api/categories
 * @desc    Create a new category with image upload
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, uploadCategory.single('category_image'), handleMulterError, addCategory);

module.exports = router;
