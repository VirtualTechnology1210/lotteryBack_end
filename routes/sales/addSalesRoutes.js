/**
 * Add Sales Routes
 */

const express = require('express');
const router = express.Router();

const { addSale } = require('../../controller/sales/addController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   POST /api/sales
 * @desc    Create a new sale entry
 * @access  Authenticated users (user_id is taken from logged-in user)
 */
router.post('/', authenticate, addSale);

module.exports = router;
