/**
 * Update Product Controller
 * Handles updating existing products
 */

const { Product, Category } = require('../../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Update product
 * @route PUT /api/products/:id
 * @access Admin or users with edit permission
 * 
 * Body:
 * - category_id: number (optional)
 * - product_name: string (optional)
 * - product_code: string (optional, must be unique)
 * - price: number (optional)
 * - status: number (optional)
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, product_name, product_code, price, status } = req.body;

        // Find the product
        const product = await Product.findByPk(id);

        if (!product) {
            return sendNotFound(res, 'Product');
        }

        // Validate fields if provided
        const validationErrors = [];

        if (product_name !== undefined && product_name.trim() === '') {
            validationErrors.push({ field: 'product_name', message: 'Product name cannot be empty' });
        }

        if (product_code !== undefined && product_code.trim() === '') {
            validationErrors.push({ field: 'product_code', message: 'Product code cannot be empty' });
        }

        if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
            validationErrors.push({ field: 'price', message: 'Price must be a valid positive number' });
        }

        if (validationErrors.length > 0) {
            return sendValidationError(res, validationErrors);
        }

        // Verify category if provided
        if (category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                return sendError(res, 'Selected category does not exist', 400);
            }
        }

        // Check for duplicate product code (excluding current product)
        if (product_code) {
            const existingProduct = await Product.findOne({
                where: {
                    product_code: product_code.trim().toUpperCase(),
                    id: { [Op.ne]: id }
                }
            });

            if (existingProduct) {
                return sendError(res, 'Product code already exists. Please use a unique code.', 409);
            }
        }

        // Build update data
        const updateData = {};

        if (category_id !== undefined) updateData.category_id = category_id;
        if (product_name !== undefined) updateData.product_name = product_name.trim();
        if (product_code !== undefined) updateData.product_code = product_code.trim().toUpperCase();
        if (price !== undefined) updateData.price = parseFloat(price);
        if (status !== undefined) updateData.status = status;

        // Update the product
        await product.update(updateData);

        // Fetch updated product with associations
        const updatedProduct = await Product.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                }
            ]
        });

        return sendSuccess(res, 'Product updated successfully', {
            product: {
                id: updatedProduct.id,
                category_id: updatedProduct.category_id,
                category_name: updatedProduct.category?.category_name,
                product_name: updatedProduct.product_name,
                product_code: updatedProduct.product_code,
                price: parseFloat(updatedProduct.price),
                status: updatedProduct.status,
                user_id: updatedProduct.user_id,
                createdAt: updatedProduct.createdAt,
                updatedAt: updatedProduct.updatedAt
            }
        });

    } catch (error) {
        console.error('Update product error:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return sendError(res, 'Product code already exists. Please use a unique code.', 409);
        }

        return sendError(res, 'An error occurred while updating product.');
    }
};

/**
 * Toggle product status
 * @route PATCH /api/products/:id/status
 * @access Admin or users with edit permission
 */
const toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return sendNotFound(res, 'Product');
        }

        // Toggle status
        const newStatus = product.status === 1 ? 0 : 1;
        await product.update({ status: newStatus });

        return sendSuccess(res, `Product ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`, {
            product: {
                id: product.id,
                product_name: product.product_name,
                product_code: product.product_code,
                status: newStatus
            }
        });

    } catch (error) {
        console.error('Toggle product status error:', error);
        return sendError(res, 'An error occurred while updating product status.');
    }
};

module.exports = {
    updateProduct,
    toggleProductStatus
};
