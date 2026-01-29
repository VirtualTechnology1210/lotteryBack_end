/**
 * Update Category Routes
 */

const express = require('express');
const router = express.Router();

const { updateCategory } = require('../../controller/category/updateController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');
const { uploadCategory, handleMulterError } = require('../../config/multerConfig');

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category by ID with optional image upload
 * @access  Admin only
 */
router.put('/:id', authenticate, requireAdmin, uploadCategory.single('category_image'), handleMulterError, updateCategory);

module.exports = router;
