/**
 * Add Sales Controller
 * Handles creating new sales entries
 */

const { Sales, Category, User } = require('../../models');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Create a new sale entry
 * @route POST /api/sales
 * @access Admin or User
 */
const addSale = async (req, res) => {
    try {
        const { name, desc, qty, price, category_id } = req.body;
        const user_id = req.user.id; // User who is creating this sale

        // Validate required fields
        const errors = [];
        if (!name || name.trim() === '') {
            errors.push({ field: 'name', message: 'Product name is required' });
        }
        if (!price || isNaN(price) || parseFloat(price) < 0) {
            errors.push({ field: 'price', message: 'Valid price is required' });
        }
        if (!category_id) {
            errors.push({ field: 'category_id', message: 'Category is required' });
        }
        if (qty && (isNaN(qty) || parseInt(qty) < 1)) {
            errors.push({ field: 'qty', message: 'Quantity must be at least 1' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Verify category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return sendNotFound(res, 'Category');
        }

        // Create sale entry
        const sale = await Sales.create({
            name: name.trim(),
            desc: desc ? desc.trim() : null,
            qty: qty ? parseInt(qty) : 1,
            price: parseFloat(price),
            category_id,
            user_id
        });

        // Fetch the created sale with associations
        const createdSale = await Sales.findByPk(sale.id, {
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

        return sendSuccess(res, 'Sale created successfully', {
            sale: createdSale
        }, 201);

    } catch (error) {
        console.error('Add sale error:', error);
        return sendError(res, 'An error occurred while creating sale.');
    }
};

module.exports = {
    addSale
};
