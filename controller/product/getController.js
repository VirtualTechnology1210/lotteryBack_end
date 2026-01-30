/**
 * Get Product Controller
 * Handles fetching products with various filters
 */

const { Product, Category, User } = require('../../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Transform product data for response
 */
const transformProduct = (product) => {
    return {
        id: product.id,
        category_id: product.category_id,
        category_name: product.category?.category_name || null,
        product_name: product.product_name,
        product_code: product.product_code,
        price: parseFloat(product.price),
        status: product.status,
        user_id: product.user_id,
        created_by: product.createdBy?.name || null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };
};

/**
 * Get all products with optional filters
 * @route GET /api/products
 * @access Admin or users with view permission
 * 
 * Query params:
 * - category_id: number (optional) - Filter by category
 * - status: number (optional) - Filter by status (1=active, 0=inactive)
 * - search: string (optional) - Search by product name or code
 * - page: number (optional) - Page number for pagination
 * - limit: number (optional) - Items per page
 */
const getAllProducts = async (req, res) => {
    try {
        const { category_id, status, search, page = 1, limit = 10 } = req.query;

        // Build where clause
        const whereClause = {};

        if (category_id) {
            whereClause.category_id = category_id;
        }

        if (status !== undefined) {
            whereClause.status = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { product_name: { [Op.like]: `%${search}%` } },
                { product_code: { [Op.like]: `%${search}%` } }
            ];
        }

        // Calculate offset for pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch products with pagination
        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const transformedProducts = products.map(transformProduct);

        return sendSuccess(res, 'Products fetched successfully', {
            count: transformedProducts.length,
            totalCount: count,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page),
            products: transformedProducts
        });

    } catch (error) {
        console.error('Get all products error:', error);
        return sendError(res, 'An error occurred while fetching products.');
    }
};

/**
 * Get single product by ID
 * @route GET /api/products/:id
 * @access Admin or users with view permission
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!product) {
            return sendNotFound(res, 'Product');
        }

        return sendSuccess(res, 'Product fetched successfully', {
            product: transformProduct(product)
        });

    } catch (error) {
        console.error('Get product by ID error:', error);
        return sendError(res, 'An error occurred while fetching product.');
    }
};

/**
 * Get active products (for dropdowns/selection)
 * @route GET /api/products/active
 * @access Authenticated users
 */
const getActiveProducts = async (req, res) => {
    try {
        const { category_id } = req.query;

        const whereClause = { status: 1 };

        if (category_id) {
            whereClause.category_id = category_id;
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                }
            ],
            order: [['product_name', 'ASC']]
        });

        const transformedProducts = products.map(transformProduct);

        return sendSuccess(res, 'Products fetched successfully', {
            count: transformedProducts.length,
            products: transformedProducts
        });

    } catch (error) {
        console.error('Get active products error:', error);
        return sendError(res, 'An error occurred while fetching products.');
    }
};

/**
 * Get products by category
 * @route GET /api/products/category/:categoryId
 * @access Authenticated users
 */
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { status } = req.query;

        // Check if category exists
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return sendNotFound(res, 'Category');
        }

        const whereClause = { category_id: categoryId };

        if (status !== undefined) {
            whereClause.status = status;
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name']
                }
            ],
            order: [['product_name', 'ASC']]
        });

        const transformedProducts = products.map(transformProduct);

        return sendSuccess(res, 'Products fetched successfully', {
            category: {
                id: category.id,
                name: category.category_name
            },
            count: transformedProducts.length,
            products: transformedProducts
        });

    } catch (error) {
        console.error('Get products by category error:', error);
        return sendError(res, 'An error occurred while fetching products.');
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getActiveProducts,
    getProductsByCategory
};
