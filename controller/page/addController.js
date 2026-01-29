/**
 * Add Page Controller
 * Handles creating new pages (Admin only)
 */

const { Page } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');

/**
 * Create a new page
 * @route POST /api/pages
 * @access Admin only
 */
const addPage = async (req, res) => {
    try {
        const { page } = req.body;

        // Validate required fields
        if (!page || page.trim() === '') {
            return sendValidationError(res, [{ field: 'page', message: 'Page name is required' }]);
        }

        // Check if page already exists
        const existingPage = await Page.findOne({
            where: { page: page.trim() }
        });

        if (existingPage) {
            return sendError(res, 'Page already exists', 409);
        }

        // Create page
        const newPage = await Page.create({
            page: page.trim()
        });

        return sendSuccess(res, 'Page created successfully', {
            page: newPage
        }, 201);

    } catch (error) {
        console.error('Add page error:', error);
        return sendError(res, 'An error occurred while creating page.');
    }
};

module.exports = {
    addPage
};
