/**
 * Delete Category Routes
 */

const express = require('express');
const router = express.Router();

const { deleteCategory } = require('../../controller/category/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category by ID
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

module.exports = router;
