/**
 * Delete Product Controller
 * Handles deleting products
 */

const { Product } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Delete a product
 * @route DELETE /api/products/:id
 * @access Admin or users with delete permission
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return sendNotFound(res, 'Product');
        }

        // Store product info for response
        const productInfo = {
            id: product.id,
            product_name: product.product_name,
            product_code: product.product_code
        };

        // Delete the product
        await product.destroy();

        return sendSuccess(res, 'Product deleted successfully', {
            deletedProduct: productInfo
        });

    } catch (error) {
        console.error('Delete product error:', error);

        // Handle foreign key constraint error
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return sendError(res, 'Cannot delete product. It is being used in other records.', 400);
        }

        return sendError(res, 'An error occurred while deleting product.');
    }
};

/**
 * Soft delete (deactivate) a product
 * @route DELETE /api/products/:id/soft
 * @access Admin or users with delete permission
 */
const softDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return sendNotFound(res, 'Product');
        }

        // Soft delete by setting status to 0
        await product.update({ status: 0 });

        return sendSuccess(res, 'Product deactivated successfully', {
            product: {
                id: product.id,
                product_name: product.product_name,
                product_code: product.product_code,
                status: 0
            }
        });

    } catch (error) {
        console.error('Soft delete product error:', error);
        return sendError(res, 'An error occurred while deactivating product.');
    }
};

module.exports = {
    deleteProduct,
    softDeleteProduct
};
