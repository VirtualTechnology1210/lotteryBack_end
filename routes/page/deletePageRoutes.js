/**
 * Delete Page Routes
 */

const express = require('express');
const router = express.Router();

const { deletePage } = require('../../controller/page/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   DELETE /api/pages/:id
 * @desc    Delete page by ID
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deletePage);

module.exports = router;
