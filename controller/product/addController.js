/**
 * Add Product Controller
 * Handles creating new products with category selection
 */

const { Product, Category } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');

/**
 * Create a new product
 * @route POST /api/products
 * @access Admin or users with add permission
 * 
 * Body:
 * - category_id: number (required) - Category to assign product to
 * - product_name: string (required)
 * - product_code: string (required, unique)
 * - price: number (required)
 * - status: number (optional, default: 1)
 */
const addProduct = async (req, res) => {
    try {
        const { category_id, product_name, product_code, price, status, box, index_type, digit_type, winning_amounts } = req.body;
        const user_id = req.user.id; // Get the logged-in user's ID

        // Validate required fields
        const validationErrors = [];

        if (!category_id) {
            validationErrors.push({ field: 'category_id', message: 'Category is required' });
        }

        if (!product_name || product_name.trim() === '') {
            validationErrors.push({ field: 'product_name', message: 'Product name is required' });
        }

        if (!product_code || product_code.trim() === '') {
            validationErrors.push({ field: 'product_code', message: 'Product code is required' });
        }

        if (price === undefined || price === null || price === '') {
            validationErrors.push({ field: 'price', message: 'Price is required' });
        } else if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            validationErrors.push({ field: 'price', message: 'Price must be a valid positive number' });
        }

        // ── Auto-derive digit_type from index_type if needed ──
        let effectiveDigitType = digit_type !== undefined && digit_type !== null ? parseInt(digit_type) : null;
        const isIndexBased = index_type && index_type.length >= 1;
        if (isIndexBased && effectiveDigitType === null) {
            // Single letter (A,B,C) → 1 digit; Double letter (AB,BC,AC) → 2 digits
            effectiveDigitType = index_type.length === 1 ? 1 : (index_type.length === 2 ? 2 : null);
        }

        // Validate digit_type
        if (effectiveDigitType !== null) {
            if (![1, 2, 3, 4].includes(effectiveDigitType)) {
                validationErrors.push({ field: 'digit_type', message: 'Digit type must be 1, 2, 3, or 4' });
            } else if (winning_amounts) {
                const wa = typeof winning_amounts === 'string' ? JSON.parse(winning_amounts) : winning_amounts;
                if (isIndexBased) {
                    // Index-based: only need one prize at key = effectiveDigitType
                    const key = String(effectiveDigitType);
                    if (wa[key] === undefined || wa[key] === null || wa[key] === '') {
                        validationErrors.push({ field: 'winning_amounts', message: 'Prize amount is required' });
                    } else if (isNaN(parseFloat(wa[key])) || parseFloat(wa[key]) < 0) {
                        validationErrors.push({ field: 'winning_amounts', message: 'Prize amount must be a valid positive number' });
                    }
                } else {
                    // Manual: need all levels 1..effectiveDigitType
                    for (let i = 1; i <= effectiveDigitType; i++) {
                        if (wa[String(i)] === undefined || wa[String(i)] === null || wa[String(i)] === '') {
                            validationErrors.push({ field: 'winning_amounts', message: `Winning amount for ${i}-digit match is required` });
                        } else if (isNaN(parseFloat(wa[String(i)])) || parseFloat(wa[String(i)]) < 0) {
                            validationErrors.push({ field: 'winning_amounts', message: `Winning amount for ${i}-digit match must be a valid positive number` });
                        }
                    }
                }
            }
        }

        if (validationErrors.length > 0) {
            return sendValidationError(res, validationErrors);
        }

        // Check if category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return sendError(res, 'Selected category does not exist', 400);
        }

        // Check if product code already exists
        const existingProduct = await Product.findOne({
            where: { product_code: product_code.trim().toUpperCase() }
        });

        if (existingProduct) {
            return sendError(res, 'Product code already exists. Please use a unique code.', 409);
        }

        // Parse winning_amounts if provided
        let parsedWinningAmounts = null;
        if (effectiveDigitType && winning_amounts) {
            const wa = typeof winning_amounts === 'string' ? JSON.parse(winning_amounts) : winning_amounts;
            parsedWinningAmounts = {};
            if (isIndexBased) {
                // Index-based: store single prize at key = effectiveDigitType
                parsedWinningAmounts[String(effectiveDigitType)] = parseFloat(wa[String(effectiveDigitType)]);
            } else {
                // Manual: store all levels 1..effectiveDigitType
                for (let i = 1; i <= effectiveDigitType; i++) {
                    parsedWinningAmounts[String(i)] = parseFloat(wa[String(i)]);
                }
            }
        }

        // Create product
        const product = await Product.create({
            category_id,
            product_name: product_name.trim(),
            product_code: product_code.trim().toUpperCase(), // Store in uppercase for consistency
            price: parseFloat(price),
            user_id,
            status: status !== undefined ? status : 1,
            box: box !== undefined ? box : 0,
            index_type: index_type || null,
            digit_type: effectiveDigitType,
            winning_amounts: parsedWinningAmounts
        });

        // Fetch the product with associations for response
        const productWithDetails = await Product.findByPk(product.id, {
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                }
            ]
        });

        return sendSuccess(res, 'Product created successfully', {
            product: {
                id: productWithDetails.id,
                category_id: productWithDetails.category_id,
                category_name: productWithDetails.category?.category_name,
                product_name: productWithDetails.product_name,
                product_code: productWithDetails.product_code,
                price: productWithDetails.price,
                status: productWithDetails.status,
                box: productWithDetails.box,
                index_type: productWithDetails.index_type || null,
                digit_type: productWithDetails.digit_type || null,
                winning_amounts: productWithDetails.winning_amounts || null,
                user_id: productWithDetails.user_id,
                createdAt: productWithDetails.createdAt,
                updatedAt: productWithDetails.updatedAt
            }
        }, 201);

    } catch (error) {
        console.error('Add product error:', error);

        // Handle unique constraint error
        if (error.name === 'SequelizeUniqueConstraintError') {
            return sendError(res, 'Product code already exists. Please use a unique code.', 409);
        }

        return sendError(res, 'An error occurred while creating product.');
    }
};

module.exports = {
    addProduct
};
