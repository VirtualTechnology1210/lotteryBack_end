/**
 * Add Page Routes
 */

const express = require('express');
const router = express.Router();

const { addPage } = require('../../controller/page/addController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   POST /api/pages
 * @desc    Create a new page
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, addPage);

module.exports = router;
