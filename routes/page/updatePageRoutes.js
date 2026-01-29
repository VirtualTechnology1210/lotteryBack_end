/**
 * Update Page Routes
 */

const express = require('express');
const router = express.Router();

const { updatePage } = require('../../controller/page/updateController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   PUT /api/pages/:id
 * @desc    Update page by ID
 * @access  Admin only
 */
router.put('/:id', authenticate, requireAdmin, updatePage);

module.exports = router;
