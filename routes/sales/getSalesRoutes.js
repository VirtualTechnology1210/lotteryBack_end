/**
 * Get Sales Routes
 */

const express = require('express');
const router = express.Router();

const { getAllSales, getSaleById, getMySales } = require('../../controller/sales/getController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   GET /api/sales/my-sales
 * @desc    Get sales created by current user
 * @access  Authenticated users
 */
router.get('/my-sales', authenticate, getMySales);

/**
 * @route   GET /api/sales
 * @desc    Get all sales with filtering and pagination
 * @access  Authenticated users
 */
router.get('/', authenticate, getAllSales);

/**
 * @route   GET /api/sales/:id
 * @desc    Get a single sale by ID
 * @access  Authenticated users
 */
router.get('/:id', authenticate, getSaleById);

module.exports = router;
