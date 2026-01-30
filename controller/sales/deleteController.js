/**
 * Delete Sales Controller
 * Handles deleting sales entries
 */

const { Sales, Product } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Delete sale by ID
 * @route DELETE /api/sales/:id
 * @access Admin or Owner
 */
const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;

        // Find sale with product info
        const sale = await Sales.findByPk(id, {
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'product_name', 'product_code']
            }]
        });

        if (!sale) {
            return sendNotFound(res, 'Sale');
        }

        // Check ownership (only admin or the creator can delete)
        if (req.user.role !== 'admin' && sale.user_id !== req.user.id) {
            return sendError(res, 'You are not authorized to delete this sale', 403);
        }

        // Store info for response
        const deletedSaleInfo = {
            id: sale.id,
            product_name: sale.product?.product_name,
            product_code: sale.product?.product_code,
            qty: sale.qty,
            price: parseFloat(sale.price),
            total: parseFloat(sale.price) * sale.qty
        };

        // Delete sale
        await sale.destroy();

        return sendSuccess(res, 'Sale deleted successfully', {
            deletedSale: deletedSaleInfo
        });

    } catch (error) {
        console.error('Delete sale error:', error);
        return sendError(res, 'An error occurred while deleting sale.');
    }
};

module.exports = {
    deleteSale
};
