/**
 * Sales Report Controller
 * Handles sales reports with date/time filtering
 */

const { Sales, Product, Category, User, sequelize } = require('../../models');
const { sendSuccess, sendError } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Get sales report with date and time filtering
 * @route GET /api/sales/report
 * @access Authenticated users
 * NOTE: Non-admin users only see their own data
 */
const getSalesReport = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            start_time,
            end_time,
            category_id,
            product_id,
            user_id,
            page = 1,
            limit = 50
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

        // Filter by product
        if (product_id) {
            whereClause.product_id = product_id;
        }

        // Filter by category (through product)
        if (category_id) {
            productWhereClause.category_id = category_id;
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch sales with associations
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
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        // Calculate summary - simpler query without includes for aggregation
        let summaryWhereClause = { ...whereClause };

        // If filtering by category, get product IDs first
        if (Object.keys(productWhereClause).length > 0) {
            const productIds = await Product.findAll({
                where: productWhereClause,
                attributes: ['id'],
                raw: true
            });
            summaryWhereClause.product_id = productIds.map(p => p.id);
        }

        const summary = await Sales.findOne({
            where: summaryWhereClause,
            attributes: [
                [Sales.sequelize.fn('COUNT', Sales.sequelize.col('id')), 'total_records'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.col('qty')), 'total_quantity'],
                [Sales.sequelize.fn('SUM', Sales.sequelize.col('price')), 'total_amount']  // price is now total
            ],
            raw: true
        });

        // Transform sales data for report
        const reportData = sales.map(sale => ({
            id: sale.id,
            product_id: sale.product_id,
            product_name: sale.product?.product_name || null,
            product_code: sale.product?.product_code || null,
            category_id: sale.product?.category?.id || null,
            category_name: sale.product?.category?.category_name || null,
            desc: sale.desc,
            qty: sale.qty,
            unit_price: parseFloat(sale.product?.price || 0),
            total: parseFloat(sale.price),  // price column stores total
            created_by: sale.createdBy?.name || null,
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
                product_id: product_id || null,
                user_id: user_id || null
            },
            summary: {
                total_records: parseInt(summary?.total_records) || 0,
                total_quantity: parseInt(summary?.total_quantity) || 0,
                total_amount: parseFloat(summary?.total_amount) || 0
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

        // Build date filter for raw query
        let dateFilter = '';
        const replacements = {};

        if (start_date) {
            const startDateTime = start_time
                ? `${start_date} ${start_time}`
                : `${start_date} 00:00:00`;
            dateFilter += ' AND s.createdAt >= :startDate';
            replacements.startDate = startDateTime;
        }

        if (end_date) {
            const endDateTime = end_time
                ? `${end_date} ${end_time}`
                : `${end_date} 23:59:59`;
            dateFilter += ' AND s.createdAt <= :endDate';
            replacements.endDate = endDateTime;
        }

        // Use raw query for grouped report
        const [categoryReport] = await sequelize.query(`
            SELECT 
                c.id as category_id,
                c.category_name,
                COUNT(s.id) as total_sales,
                SUM(s.qty) as total_quantity,
                SUM(s.price) as total_amount
            FROM sales s
            INNER JOIN products p ON s.product_id = p.id
            INNER JOIN categories c ON p.category_id = c.id
            WHERE 1=1 ${dateFilter}
            GROUP BY c.id, c.category_name
            ORDER BY total_amount DESC
        `, { replacements });

        // Transform data
        const reportData = categoryReport.map(item => ({
            category_id: item.category_id,
            category_name: item.category_name,
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
 * Get sales report grouped by product
 * @route GET /api/sales/report/by-product
 * @access Authenticated users
 */
const getSalesReportByProduct = async (req, res) => {
    try {
        const { start_date, end_date, start_time, end_time, category_id } = req.query;

        // Build filters for raw query
        let filters = '';
        const replacements = {};

        if (start_date) {
            const startDateTime = start_time
                ? `${start_date} ${start_time}`
                : `${start_date} 00:00:00`;
            filters += ' AND s.createdAt >= :startDate';
            replacements.startDate = startDateTime;
        }

        if (end_date) {
            const endDateTime = end_time
                ? `${end_date} ${end_time}`
                : `${end_date} 23:59:59`;
            filters += ' AND s.createdAt <= :endDate';
            replacements.endDate = endDateTime;
        }

        if (category_id) {
            filters += ' AND p.category_id = :categoryId';
            replacements.categoryId = category_id;
        }

        // Use raw query for grouped report
        const [productReport] = await sequelize.query(`
            SELECT 
                p.id as product_id,
                p.product_name,
                p.product_code,
                c.id as category_id,
                c.category_name,
                COUNT(s.id) as total_sales,
                SUM(s.qty) as total_quantity,
                SUM(s.price) as total_amount
            FROM sales s
            INNER JOIN products p ON s.product_id = p.id
            INNER JOIN categories c ON p.category_id = c.id
            WHERE 1=1 ${filters}
            GROUP BY p.id, p.product_name, p.product_code, c.id, c.category_name
            ORDER BY total_amount DESC
        `, { replacements });

        // Transform data
        const reportData = productReport.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            category_id: item.category_id,
            category_name: item.category_name,
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

        return sendSuccess(res, 'Sales report by product fetched successfully', {
            filters: {
                start_date: start_date || null,
                end_date: end_date || null,
                start_time: start_time || null,
                end_time: end_time || null,
                category_id: category_id || null
            },
            overall_summary: overallTotals,
            report: reportData
        });

    } catch (error) {
        console.error('Get sales report by product error:', error);
        return sendError(res, 'An error occurred while fetching sales report by product.');
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

        // Build date filter for raw query
        let dateFilter = '';
        const replacements = {};

        if (start_date) {
            const startDateTime = start_time
                ? `${start_date} ${start_time}`
                : `${start_date} 00:00:00`;
            dateFilter += ' AND s.createdAt >= :startDate';
            replacements.startDate = startDateTime;
        }

        if (end_date) {
            const endDateTime = end_time
                ? `${end_date} ${end_time}`
                : `${end_date} 23:59:59`;
            dateFilter += ' AND s.createdAt <= :endDate';
            replacements.endDate = endDateTime;
        }

        // Use raw query for grouped report
        const [userReport] = await sequelize.query(`
            SELECT 
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                COUNT(s.id) as total_sales,
                SUM(s.qty) as total_quantity,
                SUM(s.price) as total_amount
            FROM sales s
            INNER JOIN users u ON s.user_id = u.id
            WHERE 1=1 ${dateFilter}
            GROUP BY u.id, u.name, u.email
            ORDER BY total_amount DESC
        `, { replacements });

        // Transform data
        const reportData = userReport.map(item => ({
            user_id: item.user_id,
            user_name: item.user_name,
            user_email: item.user_email,
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
    getSalesReportByProduct,
    getSalesReportByUser
};
