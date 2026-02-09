/**
 * Add Sales Routes
 */

const express = require('express');
const router = express.Router();

const { addSale, addBatchSales } = require('../../controller/sales/addController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   POST /api/sales
 * @desc    Create a new sale entry (single item)
 * @access  Authenticated users
 */
router.post('/', authenticate, addSale);

/**
 * @route   POST /api/sales/batch
 * @desc    Create batch sales (multiple items with single invoice)
 * @access  Authenticated users
 */
router.post('/batch', authenticate, addBatchSales);

module.exports = router;
