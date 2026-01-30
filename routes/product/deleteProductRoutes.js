/**
 * Delete Product Routes
 * Handles product deletion endpoints
 */

const express = require('express');
const router = express.Router();
const { deleteProduct, softDeleteProduct } = require('../../controller/product/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');

/**
 * @route   DELETE /api/products/:id/soft
 * @desc    Soft delete (deactivate) a product
 * @access  Admin or users with delete permission
 */
router.delete(
    '/:id/soft',
    authenticate,
    checkPermission('Products', 'del'),
    softDeleteProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Permanently delete a product
 * @access  Admin or users with delete permission
 */
router.delete(
    '/:id',
    authenticate,
    checkPermission('Products', 'del'),
    deleteProduct
);

module.exports = router;
