/**
 * Get Page Controller
 * Handles fetching pages (Admin only)
 */

const { Page } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Get all pages
 * @route GET /api/pages
 * @access Admin only
 */
const getAllPages = async (req, res) => {
    try {
        const pages = await Page.findAll({
            order: [['createdAt', 'DESC']]
        });

        return sendSuccess(res, 'Pages fetched successfully', {
            count: pages.length,
            pages
        });

    } catch (error) {
        console.error('Get all pages error:', error);
        return sendError(res, 'An error occurred while fetching pages.');
    }
};

/**
 * Get single page by ID
 * @route GET /api/pages/:id
 * @access Admin only
 */
const getPageById = async (req, res) => {
    try {
        const { id } = req.params;

        const page = await Page.findByPk(id);

        if (!page) {
            return sendNotFound(res, 'Page');
        }

        return sendSuccess(res, 'Page fetched successfully', {
            page
        });

    } catch (error) {
        console.error('Get page by ID error:', error);
        return sendError(res, 'An error occurred while fetching page.');
    }
};

module.exports = {
    getAllPages,
    getPageById
};
