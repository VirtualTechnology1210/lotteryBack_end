/**
 * Sales Report Routes
 */

const express = require('express');
const router = express.Router();

const { getSalesReport, getSalesReportByCategory, getSalesReportByProduct, getSalesReportByUser } = require('../../controller/sales/reportController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   GET /api/sales/report
 * @desc    Get sales report with date/time filtering
 * @access  Authenticated users
 * 
 * Query params:
 * - start_date: YYYY-MM-DD
 * - end_date: YYYY-MM-DD
 * - start_time: HH:mm:ss (optional)
 * - end_time: HH:mm:ss (optional)
 * - category_id: number (optional)
 * - product_id: number (optional)
 * - user_id: number (optional)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
router.get('/', authenticate, getSalesReport);

/**
 * @route   GET /api/sales/report/by-category
 * @desc    Get sales report grouped by category
 * @access  Authenticated users
 */
router.get('/by-category', authenticate, getSalesReportByCategory);

/**
 * @route   GET /api/sales/report/by-product
 * @desc    Get sales report grouped by product
 * @access  Authenticated users
 */
router.get('/by-product', authenticate, getSalesReportByProduct);

/**
 * @route   GET /api/sales/report/by-user
 * @desc    Get sales report grouped by user
 * @access  Admin only
 */
router.get('/by-user', authenticate, requireAdmin, getSalesReportByUser);

module.exports = router;

