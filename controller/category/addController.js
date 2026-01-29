/**
 * Add Category Controller
 * Handles creating new categories with image upload
 */

const path = require('path');
const { Category } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');
const { getFileUrl, deleteFile } = require('../../config/multerConfig');

/**
 * Create a new category
 * @route POST /api/categories
 * @access Admin only
 */
const addCategory = async (req, res) => {
    try {
        const { category_name, status } = req.body;

        // Validate required fields
        if (!category_name || category_name.trim() === '') {
            // Delete uploaded file if validation fails
            if (req.file) {
                deleteFile(req.file.path);
            }
            return sendValidationError(res, [{ field: 'category_name', message: 'Category name is required' }]);
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({
            where: { category_name: category_name.trim() }
        });

        if (existingCategory) {
            // Delete uploaded file if category exists
            if (req.file) {
                deleteFile(req.file.path);
            }
            return sendError(res, 'Category already exists', 409);
        }

        // Get image filename if uploaded
        const category_image = req.file ? req.file.filename : null;

        // Create category
        const category = await Category.create({
            category_name: category_name.trim(),
            category_image,
            status: status !== undefined ? status : 1
        });

        // Prepare response with image URL
        const responseData = {
            id: category.id,
            category_name: category.category_name,
            category_image: getFileUrl(category.category_image),
            status: category.status,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        };

        return sendSuccess(res, 'Category created successfully', {
            category: responseData
        }, 201);

    } catch (error) {
        console.error('Add category error:', error);
        // Delete uploaded file on error
        if (req.file) {
            deleteFile(req.file.path);
        }
        return sendError(res, 'An error occurred while creating category.');
    }
};

module.exports = {
    addCategory
};
