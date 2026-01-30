/**
 * Add Sales Controller
 * Handles creating new sales entries
 */

const { Sales, Product, Category, User } = require('../../models');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Create a new sale entry
 * @route POST /api/sales
 * @access Admin or User with add permission
 * 
 * Body:
 * - product_id: number (required) - Product being sold
 * - qty: number (required) - Quantity sold
 * - price: number (optional) - Price override, defaults to product price
 * - desc: string (optional) - Sale description/notes
 */
const addSale = async (req, res) => {
    try {
        const { product_id, qty, price, desc } = req.body;
        const user_id = req.user.id; // User who is making this sale

        // Validate required fields
        const errors = [];
        if (!product_id) {
            errors.push({ field: 'product_id', message: 'Product is required' });
        }
        if (!qty || isNaN(qty) || parseInt(qty) < 1) {
            errors.push({ field: 'qty', message: 'Quantity must be at least 1' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Verify product exists and is active
        const product = await Product.findByPk(product_id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }]
        });

        if (!product) {
            return sendNotFound(res, 'Product');
        }

        if (product.status !== 1) {
            return sendError(res, 'Cannot sell an inactive product', 400);
        }

        // Use provided price or default to product price
        const salePrice = price !== undefined && price !== null ? parseFloat(price) : parseFloat(product.price);

        if (isNaN(salePrice) || salePrice < 0) {
            return sendValidationError(res, [{ field: 'price', message: 'Price must be a valid positive number' }]);
        }

        // Create sale entry
        const sale = await Sales.create({
            product_id,
            desc: desc ? desc.trim() : null,
            qty: parseInt(qty),
            price: salePrice,
            user_id
        });

        // Fetch the created sale with associations
        const createdSale = await Sales.findByPk(sale.id, {
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'product_name', 'product_code', 'price'],
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
            id: createdSale.id,
            product_id: createdSale.product_id,
            product_name: createdSale.product?.product_name,
            product_code: createdSale.product?.product_code,
            category_id: createdSale.product?.category?.id,
            category_name: createdSale.product?.category?.category_name,
            desc: createdSale.desc,
            qty: createdSale.qty,
            price: parseFloat(createdSale.price),
            total: parseFloat(createdSale.price) * createdSale.qty,
            user_id: createdSale.user_id,
            created_by: createdSale.createdBy?.name,
            createdAt: createdSale.createdAt,
            updatedAt: createdSale.updatedAt
        };

        return sendSuccess(res, 'Sale created successfully', {
            sale: responseData
        }, 201);

    } catch (error) {
        console.error('Add sale error:', error);
        return sendError(res, 'An error occurred while creating sale.');
    }
};

module.exports = {
    addSale
};
