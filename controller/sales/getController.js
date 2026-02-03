/**
 * Get Sales Controller
 * Handles fetching sales entries
 */

const { Sales, Product, Category, User } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Transform sale data for response
 */
const transformSale = (sale) => {
    return {
        id: sale.id,
        product_id: sale.product_id,
        product_name: sale.product?.product_name || null,
        product_code: sale.product?.product_code || null,
        category_id: sale.product?.category?.id || null,
        category_name: sale.product?.category?.category_name || null,
        desc: sale.desc,
        qty: sale.qty,
        price: parseFloat(sale.price),
        total: parseFloat(sale.price) * sale.qty,
        user_id: sale.user_id,
        created_by: sale.createdBy?.name || null,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
    };
};

/**
 * Get all sales with filtering and pagination
 * @route GET /api/sales
 * @access Admin or User with view permission
 * NOTE: Non-admin users only see their own data
 */
const getAllSales = async (req, res) => {
    try {
        const {
            product_id,
            category_id,
            user_id,
            search,
            page = 1,
            limit = 10,
            sort_by = 'createdAt',
            sort_order = 'DESC'
        } = req.query;

        const whereClause = {};
        const productWhereClause = {};

        // DATA ISOLATION: Non-admin users can only see their own data
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin) {
            // Force filter to current user's data only
            whereClause.user_id = req.user.id;
        } else if (user_id) {
            // Admin can filter by specific user if requested
            whereClause.user_id = user_id;
        }

        // Filter by product
        if (product_id) {
            whereClause.product_id = product_id;
        }

        // Filter by category (through product)
        if (category_id) {
            productWhereClause.category_id = category_id;
        }

        // Search by product name or code
        if (search) {
            productWhereClause[Op.or] = [
                { product_name: { [Op.like]: `%${search}%` } },
                { product_code: { [Op.like]: `%${search}%` } }
            ];
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Valid sort fields
        const validSortFields = ['createdAt', 'updatedAt', 'qty', 'price'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows: sales } = await Sales.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'product_name', 'product_code', 'price', 'category_id'],
                    where: Object.keys(productWhereClause).length > 0 ? productWhereClause : undefined,
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
            ],
            order: [[sortField, sortDirection]],
            limit: parseInt(limit),
            offset
        });

        return sendSuccess(res, 'Sales fetched successfully', {
            count: sales.length,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            sales: sales.map(transformSale)
        });

    } catch (error) {
        console.error('Get all sales error:', error);
        return sendError(res, 'An error occurred while fetching sales.');
    }
};

/**
 * Get single sale by ID
 * @route GET /api/sales/:id
 * @access Admin or User with view permission
 */
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const sale = await Sales.findByPk(id, {
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

        if (!sale) {
            return sendNotFound(res, 'Sale');
        }

        return sendSuccess(res, 'Sale fetched successfully', {
            sale: transformSale(sale)
        });

    } catch (error) {
        console.error('Get sale by ID error:', error);
        return sendError(res, 'An error occurred while fetching sale.');
    }
};

/**
 * Get sales by current user
 * @route GET /api/sales/my-sales
 * @access Authenticated users
 */
const getMySales = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: sales } = await Sales.findAndCountAll({
            where: { user_id },
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
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        return sendSuccess(res, 'Your sales fetched successfully', {
            count: sales.length,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            sales: sales.map(transformSale)
        });

    } catch (error) {
        console.error('Get my sales error:', error);
        return sendError(res, 'An error occurred while fetching your sales.');
    }
};

module.exports = {
    getAllSales,
    getSaleById,
    getMySales
};
