/**
 * Update Page Controller
 * Handles updating pages (Admin only)
 */

const { Page } = require('../../models');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../../utils/responseUtils');

/**
 * Update page by ID
 * @route PUT /api/pages/:id
 * @access Admin only
 */
const updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { page } = req.body;

        // Find page
        const existingPage = await Page.findByPk(id);

        if (!existingPage) {
            return sendNotFound(res, 'Page');
        }

        // Validate
        if (page !== undefined && page.trim() === '') {
            return sendValidationError(res, [{ field: 'page', message: 'Page name cannot be empty' }]);
        }

        // Check if new name already exists
        if (page && page.trim() !== existingPage.page) {
            const duplicatePage = await Page.findOne({
                where: { page: page.trim() }
            });

            if (duplicatePage) {
                return sendError(res, 'Page name already exists', 409);
            }
        }

        // Update page
        if (page) {
            await existingPage.update({ page: page.trim() });
        }

        return sendSuccess(res, 'Page updated successfully', {
            page: existingPage
        });

    } catch (error) {
        console.error('Update page error:', error);
        return sendError(res, 'An error occurred while updating page.');
    }
};

module.exports = {
    updatePage
};
