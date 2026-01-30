/**
 * Update Product Routes
 * Handles product update endpoints
 */

const express = require('express');
const router = express.Router();
const { updateProduct, toggleProductStatus } = require('../../controller/product/updateController');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Toggle product status (active/inactive)
 * @access  Admin or users with edit permission
 */
router.patch(
    '/:id/status',
    authenticate,
    checkPermission('Products', 'edit'),
    toggleProductStatus
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product details
 * @access  Admin or users with edit permission
 */
router.put(
    '/:id',
    authenticate,
    checkPermission('Products', 'edit'),
    updateProduct
);

module.exports = router;
