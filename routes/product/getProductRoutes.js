/**
 * Get Product Routes
 * Handles product retrieval endpoints
 */

const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getActiveProducts,
    getProductsByCategory
} = require('../../controller/product/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route   GET /api/products/active
 * @desc    Get all active products (for dropdowns)
 * @access  Authenticated users
 */
router.get('/active', authenticate, getActiveProducts);

/**
 * @route   GET /api/products/category/:categoryId
 * @desc    Get products by category
 * @access  Authenticated users
 */
router.get('/category/:categoryId', authenticate, getProductsByCategory);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Admin or users with view permission
 */
router.get(
    '/:id',
    authenticate,
    checkPermission('Products', 'view'),
    getProductById
);

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filters
 * @access  Admin or users with view permission
 */
router.get(
    '/',
    authenticate,
    checkPermission('Products', 'view'),
    getAllProducts
);

module.exports = router;
