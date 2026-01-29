/**
 * Delete Page Controller
 * Handles deleting pages (Admin only)
 */

const { Page, Permission } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Delete page by ID
 * @route DELETE /api/pages/:id
 * @access Admin only
 */
const deletePage = async (req, res) => {
    try {
        const { id } = req.params;

        // Find page
        const page = await Page.findByPk(id);

        if (!page) {
            return sendNotFound(res, 'Page');
        }

        // Store page info for response
        const deletedPageInfo = {
            id: page.id,
            page: page.page
        };

        // Delete page (permissions will be cascade deleted)
        await page.destroy();

        return sendSuccess(res, 'Page deleted successfully', {
            deletedPage: deletedPageInfo
        });

    } catch (error) {
        console.error('Delete page error:', error);
        return sendError(res, 'An error occurred while deleting page.');
    }
};

module.exports = {
    deletePage
};
