/**
 * Sales Report Controller
 * Handles sales report with date/time filtering
 */

const { Sales, Category, User } = require('../../models');
const { sendSuccess, sendError } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Get sales report with date and time filtering
 * @route GET /api/sales/report
 * @access Authenticated users
 * 
 * Query Parameters:
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 * - start_time: Start time (HH:mm:ss) - optional
 * - end_time: End time (HH:mm:ss) - optional
 * - category_id: Filter by category - optional
 * - user_id: Filter by user who created - optional
 * - page: Page number (default: 1)
 * - limit: Records per page (default: 50)
 */
const getSalesReport = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            start_time,
            end_time,
            category_id,
            user_id,
            page = 1,
            limit = 50
        } = req.query;

        const whereClause = {};

        // Date and Time filtering
        if (start_date || end_date) {
            whereClause.createdAt = {};

            if (start_date) {
                // If start_time is provided, combine with date, otherwise use start of day
                const startDateTime = start_time
                    ? new Date(`${start_date}T${start_time}`)
                    : new Date(`${start_date}T00:00:00`);
                whereClause.createdAt[Op.gte] = startDateTime;
            }

            if (end_date) {
                // If end_time is provided, combine with date, otherwise use end of day
                const endDateTime = end_time
                    ? new Date(`${end_date}T${end_time}`)
                    : new Date(`${end_date}T23:59:59`);
                whereClause.createdAt[Op.lte] = endDateTime;
            }
        }

        // Filter by category
        if (category_id) {
            whereClause.category_id = category_id;
        }

        // Filter by user who created the sale
        if (user_id) {
            whereClause.user_id = user_id;
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch sales with associations
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
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            attributes: ['id', 'name', 'desc', 'qty', 'price', 'category_id', 'user_id', 'createdAt', 'updatedAt']
        });

        // Calculate summary
        const summary = await Sales.findOne({
            where: whereClause,
            attributes: [
                [Sales.sequelize.fn('COUNT', Sales.sequelize.col('id')), 'total_records'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.col('qty')), 'total_quantity'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.literal('qty * price')), 'total_amount']
            ],
            raw: true
        });

        // Transform sales data for report
        const reportData = sales.map(sale => ({
            id: sale.id,
            name: sale.name,
            desc: sale.desc,
            qty: sale.qty,
            price: parseFloat(sale.price),
            total: parseFloat(sale.price) * sale.qty,
            category: sale.category ? sale.category.category_name : null,
            category_id: sale.category_id,
            created_by: sale.createdBy ? sale.createdBy.name : null,
            user_id: sale.user_id,
            created_at: sale.createdAt,
            updated_at: sale.updatedAt
        }));

        return sendSuccess(res, 'Sales report fetched successfully', {
            filters: {
                start_date: start_date || null,
                end_date: end_date || null,
                start_time: start_time || null,
                end_time: end_time || null,
                category_id: category_id || null,
                user_id: user_id || null
            },
            summary: {
                total_records: parseInt(summary.total_records) || 0,
                total_quantity: parseInt(summary.total_quantity) || 0,
                total_amount: parseFloat(summary.total_amount) || 0
            },
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total_records: count,
                total_pages: Math.ceil(count / parseInt(limit))
            },
            report: reportData
        });

    } catch (error) {
        console.error('Get sales report error:', error);
        return sendError(res, 'An error occurred while fetching sales report.');
    }
};

/**
 * Get sales report grouped by category
 * @route GET /api/sales/report/by-category
 * @access Authenticated users
 */
const getSalesReportByCategory = async (req, res) => {
    try {
        const { start_date, end_date, start_time, end_time } = req.query;

        const whereClause = {};

        // Date and Time filtering
        if (start_date || end_date) {
            whereClause.createdAt = {};

            if (start_date) {
                const startDateTime = start_time
                    ? new Date(`${start_date}T${start_time}`)
                    : new Date(`${start_date}T00:00:00`);
                whereClause.createdAt[Op.gte] = startDateTime;
            }

            if (end_date) {
                const endDateTime = end_time
                    ? new Date(`${end_date}T${end_time}`)
                    : new Date(`${end_date}T23:59:59`);
                whereClause.createdAt[Op.lte] = endDateTime;
            }
        }

        // Get report grouped by category
        const categoryReport = await Sales.findAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                }
            ],
            attributes: [
                'category_id',
                [Sales.sequelize.fn('COUNT', Sales.sequelize.col('Sales.id')), 'total_sales'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.col('qty')), 'total_quantity'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.literal('qty * price')), 'total_amount']
            ],
            group: ['category_id', 'category.id', 'category.category_name'],
            raw: true,
            nest: true
        });

        // Transform data
        const reportData = categoryReport.map(item => ({
            category_id: item.category_id,
            category_name: item.category ? item.category.category_name : 'Unknown',
            total_sales: parseInt(item.total_sales) || 0,
            total_quantity: parseInt(item.total_quantity) || 0,
            total_amount: parseFloat(item.total_amount) || 0
        }));

        // Calculate overall totals
        const overallTotals = reportData.reduce((acc, item) => {
            acc.total_sales += item.total_sales;
            acc.total_quantity += item.total_quantity;
            acc.total_amount += item.total_amount;
            return acc;
        }, { total_sales: 0, total_quantity: 0, total_amount: 0 });

        return sendSuccess(res, 'Sales report by category fetched successfully', {
            filters: {
                start_date: start_date || null,
                end_date: end_date || null,
                start_time: start_time || null,
                end_time: end_time || null
            },
            overall_summary: overallTotals,
            report: reportData
        });

    } catch (error) {
        console.error('Get sales report by category error:', error);
        return sendError(res, 'An error occurred while fetching sales report by category.');
    }
};

/**
 * Get sales report grouped by user
 * @route GET /api/sales/report/by-user
 * @access Admin only
 */
const getSalesReportByUser = async (req, res) => {
    try {
        const { start_date, end_date, start_time, end_time } = req.query;

        const whereClause = {};

        // Date and Time filtering
        if (start_date || end_date) {
            whereClause.createdAt = {};

            if (start_date) {
                const startDateTime = start_time
                    ? new Date(`${start_date}T${start_time}`)
                    : new Date(`${start_date}T00:00:00`);
                whereClause.createdAt[Op.gte] = startDateTime;
            }

            if (end_date) {
                const endDateTime = end_time
                    ? new Date(`${end_date}T${end_time}`)
                    : new Date(`${end_date}T23:59:59`);
                whereClause.createdAt[Op.lte] = endDateTime;
            }
        }

        // Get report grouped by user
        const userReport = await Sales.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name', 'email']
                }
            ],
            attributes: [
                'user_id',
                [Sales.sequelize.fn('COUNT', Sales.sequelize.col('Sales.id')), 'total_sales'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.col('qty')), 'total_quantity'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.literal('qty * price')), 'total_amount']
            ],
            group: ['user_id', 'createdBy.id', 'createdBy.name', 'createdBy.email'],
            raw: true,
            nest: true
        });

        // Transform data
        const reportData = userReport.map(item => ({
            user_id: item.user_id,
            user_name: item.createdBy ? item.createdBy.name : 'Unknown',
            user_email: item.createdBy ? item.createdBy.email : 'Unknown',
            total_sales: parseInt(item.total_sales) || 0,
            total_quantity: parseInt(item.total_quantity) || 0,
            total_amount: parseFloat(item.total_amount) || 0
        }));

        // Calculate overall totals
        const overallTotals = reportData.reduce((acc, item) => {
            acc.total_sales += item.total_sales;
            acc.total_quantity += item.total_quantity;
            acc.total_amount += item.total_amount;
            return acc;
        }, { total_sales: 0, total_quantity: 0, total_amount: 0 });

        return sendSuccess(res, 'Sales report by user fetched successfully', {
            filters: {
                start_date: start_date || null,
                end_date: end_date || null,
                start_time: start_time || null,
                end_time: end_time || null
            },
            overall_summary: overallTotals,
            report: reportData
        });

    } catch (error) {
        console.error('Get sales report by user error:', error);
        return sendError(res, 'An error occurred while fetching sales report by user.');
    }
};

module.exports = {
    getSalesReport,
    getSalesReportByCategory,
    getSalesReportByUser
};
