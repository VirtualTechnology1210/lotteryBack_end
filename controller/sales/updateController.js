/**
 * Update Sales Controller
 * Handles updating sales entries
 */

const { Sales, Category, User } = require('../../models');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../../utils/responseUtils');

/**
 * Update sale by ID
 * @route PUT /api/sales/:id
 * @access Admin or Owner
 */
const updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, desc, qty, price, category_id } = req.body;

        // Find sale
        const sale = await Sales.findByPk(id);

        if (!sale) {
            return sendNotFound(res, 'Sale');
        }

        // Check ownership (only admin or the creator can update)
        if (req.user.role_id !== 1 && sale.user_id !== req.user.id) {
            return sendError(res, 'You are not authorized to update this sale', 403);
        }

        // Validate fields if provided
        const errors = [];
        if (name !== undefined && name.trim() === '') {
            errors.push({ field: 'name', message: 'Product name cannot be empty' });
        }
        if (price !== undefined && (isNaN(price) || parseFloat(price) < 0)) {
            errors.push({ field: 'price', message: 'Price must be a valid positive number' });
        }
        if (qty !== undefined && (isNaN(qty) || parseInt(qty) < 1)) {
            errors.push({ field: 'qty', message: 'Quantity must be at least 1' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Verify category exists if updating
        if (category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                return sendNotFound(res, 'Category');
            }
        }

        // Prepare update data
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (desc !== undefined) updateData.desc = desc.trim();
        if (qty !== undefined) updateData.qty = parseInt(qty);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (category_id !== undefined) updateData.category_id = category_id;

        // Update sale
        await sale.update(updateData);

        // Fetch updated sale with associations
        const updatedSale = await Sales.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        return sendSuccess(res, 'Sale updated successfully', {
            sale: updatedSale
        });

    } catch (error) {
        console.error('Update sale error:', error);
        return sendError(res, 'An error occurred while updating sale.');
    }
};

module.exports = {
    updateSale
};
