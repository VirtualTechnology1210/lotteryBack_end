/**
 * Get Category Controller
 * Handles fetching categories with time slots
 */

const { Category } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');
const { getFileUrl } = require('../../config/multerConfig');

/**
 * Transform category data with image URL
 */
const transformCategory = (category) => {
    // Parse time_slots if it's a string (from database)
    let timeSlots = category.time_slots || [];
    if (typeof timeSlots === 'string') {
        try {
            timeSlots = JSON.parse(timeSlots);
        } catch (e) {
            timeSlots = [];
        }
    }

    return {
        id: category.id,
        category_name: category.category_name,
        category_image: getFileUrl(category.category_image),
        time_slots: timeSlots,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    };
};

/**
 * Get all categories
 * @route GET /api/categories
 * @access Admin only
 */
const getAllCategories = async (req, res) => {
    try {
        const { status } = req.query;

        const whereClause = {};
        if (status !== undefined) {
            whereClause.status = status;
        }

        const categories = await Category.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        const transformedCategories = categories.map(transformCategory);

        return sendSuccess(res, 'Categories fetched successfully', {
            count: transformedCategories.length,
            categories: transformedCategories
        });

    } catch (error) {
        console.error('Get all categories error:', error);
        return sendError(res, 'An error occurred while fetching categories.');
    }
};

/**
 * Get single category by ID
 * @route GET /api/categories/:id
 * @access Admin only
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return sendNotFound(res, 'Category');
        }

        return sendSuccess(res, 'Category fetched successfully', {
            category: transformCategory(category)
        });

    } catch (error) {
        console.error('Get category by ID error:', error);
        return sendError(res, 'An error occurred while fetching category.');
    }
};

/**
 * Get active categories for mobile app
 * @route GET /api/categories/active
 * @access Authenticated users
 */
const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { status: 1 },
            order: [['category_name', 'ASC']]
        });

        const transformedCategories = categories.map(transformCategory);

        return sendSuccess(res, 'Categories fetched successfully', {
            count: transformedCategories.length,
            categories: transformedCategories
        });

    } catch (error) {
        console.error('Get active categories error:', error);
        return sendError(res, 'An error occurred while fetching categories.');
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    getActiveCategories
};
