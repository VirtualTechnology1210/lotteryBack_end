/**
 * Delete Category Controller
 * Handles deleting categories
 */

const path = require('path');
const { Category } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');
const { deleteFile } = require('../../config/multerConfig');

/**
 * Delete category by ID
 * @route DELETE /api/categories/:id
 * @access Admin only
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Find category
        const category = await Category.findByPk(id);

        if (!category) {
            return sendNotFound(res, 'Category');
        }

        // Store info for response
        const deletedCategoryInfo = {
            id: category.id,
            category_name: category.category_name
        };

        // Delete category image if exists
        if (category.category_image) {
            const imagePath = path.join(__dirname, '../../uploads/categories', category.category_image);
            deleteFile(imagePath);
        }

        // Delete category (time slots will be cascade deleted)
        await category.destroy();

        return sendSuccess(res, 'Category deleted successfully', {
            deletedCategory: deletedCategoryInfo
        });

    } catch (error) {
        console.error('Delete category error:', error);
        return sendError(res, 'An error occurred while deleting category.');
    }
};

module.exports = {
    deleteCategory
};
