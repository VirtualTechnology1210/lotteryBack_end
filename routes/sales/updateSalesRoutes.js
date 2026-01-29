/**
 * Update Sales Routes
 */

const express = require('express');
const router = express.Router();

const { updateSale } = require('../../controller/sales/updateController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   PUT /api/sales/:id
 * @desc    Update a sale entry
 * @access  Admin or Owner
 */
router.put('/:id', authenticate, updateSale);

module.exports = router;
