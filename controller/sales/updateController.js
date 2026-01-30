/**
 * Update Sales Controller
 * Handles updating sales entries
 */

const { Sales, Product, Category, User } = require('../../models');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../../utils/responseUtils');

/**
 * Update sale by ID
 * @route PUT /api/sales/:id
 * @access Admin or Owner
 * 
 * Body:
 * - product_id: number (optional) - Change product
 * - qty: number (optional) - Update quantity
 * - price: number (optional) - Update price
 * - desc: string (optional) - Update description
 */
const updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_id, qty, price, desc } = req.body;

        // Find sale
        const sale = await Sales.findByPk(id);

        if (!sale) {
            return sendNotFound(res, 'Sale');
        }

        // Check ownership (only admin or the creator can update)
        if (req.user.role !== 'admin' && sale.user_id !== req.user.id) {
            return sendError(res, 'You are not authorized to update this sale', 403);
        }

        // Validate fields if provided
        const errors = [];
        if (qty !== undefined && (isNaN(qty) || parseInt(qty) < 1)) {
            errors.push({ field: 'qty', message: 'Quantity must be at least 1' });
        }
        if (price !== undefined && (isNaN(price) || parseFloat(price) < 0)) {
            errors.push({ field: 'price', message: 'Price must be a valid positive number' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Prepare update data
        const updateData = {};

        // If product_id is being changed, verify new product exists
        if (product_id !== undefined && product_id !== sale.product_id) {
            const product = await Product.findByPk(product_id);
            if (!product) {
                return sendNotFound(res, 'Product');
            }
            if (product.status !== 1) {
                return sendError(res, 'Cannot change to an inactive product', 400);
            }
            updateData.product_id = product_id;
        }

        if (qty !== undefined) {
            updateData.qty = parseInt(qty);
        }

        if (price !== undefined) {
            updateData.price = parseFloat(price);
        }

        if (desc !== undefined) {
            updateData.desc = desc ? desc.trim() : null;
        }

        // Update sale
        await sale.update(updateData);

        // Fetch updated sale with associations
        const updatedSale = await Sales.findByPk(id, {
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'product_name', 'product_code', 'price', 'category_id'],
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name']
                    }]
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        // Transform response
        const responseData = {
            id: updatedSale.id,
            product_id: updatedSale.product_id,
            product_name: updatedSale.product?.product_name,
            product_code: updatedSale.product?.product_code,
            category_id: updatedSale.product?.category?.id,
            category_name: updatedSale.product?.category?.category_name,
            desc: updatedSale.desc,
            qty: updatedSale.qty,
            price: parseFloat(updatedSale.price),
            total: parseFloat(updatedSale.price) * updatedSale.qty,
            user_id: updatedSale.user_id,
            created_by: updatedSale.createdBy?.name,
            createdAt: updatedSale.createdAt,
            updatedAt: updatedSale.updatedAt
        };

        return sendSuccess(res, 'Sale updated successfully', {
            sale: responseData
        });

    } catch (error) {
        console.error('Update sale error:', error);
        return sendError(res, 'An error occurred while updating sale.');
    }
};

module.exports = {
    updateSale
};
