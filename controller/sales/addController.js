/**
 * Add Sales Controller
 * Handles creating new sales entries (single and batch)
 */

const { Sales, Product, Category, User, InvoiceSeries, sequelize } = require('../../models');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Create a new sale entry (single item)
 * @route POST /api/sales
 * @access Admin or User with add permission
 * 
 * Body:
 * - product_id: number (required) - Product being sold
 * - qty: number (required) - Quantity sold
 * - desc: string (optional) - Sale description/notes
 */
const addSale = async (req, res) => {
    try {
        const { product_id, qty, desc } = req.body;
        const user_id = req.user.id;

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

        // Calculate total price
        const quantity = parseInt(qty);
        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * quantity;

        // Use transaction for atomic invoice number generation
        const result = await sequelize.transaction(async (t) => {
            // Generate invoice number
            const invoiceNumber = await InvoiceSeries.getNextInvoiceNumber('sales', t);

            // Create sale entry
            const sale = await Sales.create({
                invoice_number: invoiceNumber,
                product_id,
                desc: desc ? desc.trim() : null,
                qty: quantity,
                price: totalPrice,
                user_id
            }, { transaction: t });

            return sale;
        });

        // Fetch the created sale with associations
        const createdSale = await Sales.findByPk(result.id, {
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
            invoice_number: createdSale.invoice_number,
            product_id: createdSale.product_id,
            product_name: createdSale.product?.product_name,
            product_code: createdSale.product?.product_code,
            category_id: createdSale.product?.category?.id,
            category_name: createdSale.product?.category?.category_name,
            desc: createdSale.desc,
            qty: createdSale.qty,
            unit_price: parseFloat(createdSale.product?.price || 0),
            total: parseFloat(createdSale.price),
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

/**
 * Create batch sales (multiple items with single invoice)
 * @route POST /api/sales/batch
 * @access Admin or User with add permission
 * 
 * Body:
 * - items: array (required) - Array of sale items
 *   - product_id: number (required)
 *   - qty: number (required)
 *   - desc: string (optional)
 * 
 * All items in the batch will share the same invoice number
 */
const addBatchSales = async (req, res) => {
    try {
        const { items } = req.body;
        const user_id = req.user.id;

        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            return sendValidationError(res, [
                { field: 'items', message: 'Items array is required and must not be empty' }
            ]);
        }

        // Validate each item
        const errors = [];
        items.forEach((item, index) => {
            if (!item.product_id) {
                errors.push({ field: `items[${index}].product_id`, message: 'Product is required' });
            }
            if (!item.qty || isNaN(item.qty) || parseInt(item.qty) < 1) {
                errors.push({ field: `items[${index}].qty`, message: 'Quantity must be at least 1' });
            }
        });

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Get unique product IDs
        const productIds = [...new Set(items.map(item => item.product_id))];

        // Fetch all products at once for efficiency
        const products = await Product.findAll({
            where: { id: productIds },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }]
        });

        // Create product map for quick lookup
        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });

        // Validate all products exist and are active
        for (const item of items) {
            const product = productMap[item.product_id];
            if (!product) {
                return sendNotFound(res, `Product with ID ${item.product_id}`);
            }
            if (product.status !== 1) {
                return sendError(res, `Cannot sell inactive product: ${product.product_name}`, 400);
            }
        }

        // Use transaction for atomic batch creation with single invoice
        const createdSales = await sequelize.transaction(async (t) => {
            // Generate ONE invoice number for the entire batch
            const invoiceNumber = await InvoiceSeries.getNextInvoiceNumber('sales', t);

            // Create all sales entries with same invoice number
            const salesData = items.map(item => {
                const product = productMap[item.product_id];
                const quantity = parseInt(item.qty);
                const unitPrice = parseFloat(product.price);
                const totalPrice = unitPrice * quantity;

                return {
                    invoice_number: invoiceNumber,
                    product_id: item.product_id,
                    desc: item.desc ? item.desc.trim() : null,
                    qty: quantity,
                    price: totalPrice,
                    user_id
                };
            });

            const sales = await Sales.bulkCreate(salesData, { transaction: t });
            return { sales, invoiceNumber };
        });

        // Fetch created sales with associations
        const saleIds = createdSales.sales.map(s => s.id);
        const salesWithDetails = await Sales.findAll({
            where: { id: saleIds },
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
            ],
            order: [['id', 'ASC']]
        });

        // Calculate batch totals
        const grandTotal = salesWithDetails.reduce((sum, sale) => sum + parseFloat(sale.price), 0);
        const totalQuantity = salesWithDetails.reduce((sum, sale) => sum + sale.qty, 0);

        // Transform response
        const responseData = salesWithDetails.map(sale => ({
            id: sale.id,
            invoice_number: sale.invoice_number,
            product_id: sale.product_id,
            product_name: sale.product?.product_name,
            product_code: sale.product?.product_code,
            category_id: sale.product?.category?.id,
            category_name: sale.product?.category?.category_name,
            desc: sale.desc,
            qty: sale.qty,
            unit_price: parseFloat(sale.product?.price || 0),
            total: parseFloat(sale.price),
            user_id: sale.user_id,
            created_by: sale.createdBy?.name,
            createdAt: sale.createdAt,
            updatedAt: sale.updatedAt
        }));

        return sendSuccess(res, 'Batch sales created successfully', {
            invoice_number: createdSales.invoiceNumber,
            items_count: salesWithDetails.length,
            total_quantity: totalQuantity,
            grand_total: grandTotal,
            sales: responseData
        }, 201);

    } catch (error) {
        console.error('Add batch sales error:', error);
        return sendError(res, 'An error occurred while creating batch sales.');
    }
};

module.exports = {
    addSale,
    addBatchSales
};
