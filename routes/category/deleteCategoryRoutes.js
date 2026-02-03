/**
 * Delete Category Routes
 */

const express = require('express');
const router = express.Router();

const { deleteCategory } = require('../../controller/category/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { canDelete } = require('../../middleware/permissionMiddleware');

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category by ID
 * @access  Users with delete permission
 */
router.delete('/:id', authenticate, canDelete('Categories'), deleteCategory);

module.exports = router;
