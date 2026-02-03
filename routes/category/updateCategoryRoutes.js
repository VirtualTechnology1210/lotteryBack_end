/**
 * Update Category Routes
 */

const express = require('express');
const router = express.Router();

const { updateCategory } = require('../../controller/category/updateController');
const { authenticate } = require('../../middleware/authMiddleware');
const { canEdit } = require('../../middleware/permissionMiddleware');
const { uploadCategory, handleMulterError } = require('../../config/multerConfig');

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category by ID with optional image upload
 * @access  Users with edit permission
 */
router.put('/:id', authenticate, canEdit('Categories'), uploadCategory.single('category_image'), handleMulterError, updateCategory);

module.exports = router;
