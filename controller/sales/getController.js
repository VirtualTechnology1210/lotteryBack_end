/**
 * Get Sales Controller
 * Handles fetching sales entries
 */

const { Sales, Category, User } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Get all sales with filtering and pagination
 * @route GET /api/sales
 * @access Admin or User
 */
const getAllSales = async (req, res) => {
    try {
        const {
            category_id,
            user_id,
            search,
            page = 1,
            limit = 10,
            sort_by = 'createdAt',
            sort_order = 'DESC'
        } = req.query;

        const whereClause = {};

        // Filter by category
        if (category_id) {
            whereClause.category_id = category_id;
        }

        // Filter by user who created
        if (user_id) {
            whereClause.user_id = user_id;
        }

        // Search by name or description
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { desc: { [Op.like]: `%${search}%` } }
            ];
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Valid sort fields
        const validSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'qty'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows: sales } = await Sales.findAndCountAll({
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
            sales
        });

    } catch (error) {
        console.error('Get all sales error:', error);
        return sendError(res, 'An error occurred while fetching sales.');
    }
};

/**
 * Get single sale by ID
 * @route GET /api/sales/:id
 * @access Admin or User
 */
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        const sale = await Sales.findByPk(id, {
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

        if (!sale) {
            return sendNotFound(res, 'Sale');
        }

        return sendSuccess(res, 'Sale fetched successfully', {
            sale
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
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
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
            sales
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
