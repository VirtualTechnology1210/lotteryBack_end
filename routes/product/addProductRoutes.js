/**
 * Add Product Routes
 * Handles product creation endpoints
 */

const express = require('express');
const router = express.Router();
const { addProduct } = require('../../controller/product/addController');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin or users with add permission on Products page
 */
router.post(
    '/',
    authenticate,
    checkPermission('Products', 'add'),
    addProduct
);

module.exports = router;
