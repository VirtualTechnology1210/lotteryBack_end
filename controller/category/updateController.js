/**
 * Update Category Controller
 * Handles updating categories with image upload and time slots
 */

const path = require('path');
const { Category } = require('../../models');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../../utils/responseUtils');
const { getFileUrl, deleteFile } = require('../../config/multerConfig');

/**
 * Update category by ID
 * @route PUT /api/categories/:id
 * @access Admin only
 */
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, time_slots, status } = req.body;

        // Find category
        const category = await Category.findByPk(id);

        if (!category) {
            // Delete uploaded file if category not found
            if (req.file) {
                deleteFile(req.file.path);
            }
            return sendNotFound(res, 'Category');
        }

        // Validate name if provided
        if (category_name !== undefined && category_name.trim() === '') {
            if (req.file) {
                deleteFile(req.file.path);
            }
            return sendValidationError(res, [{ field: 'category_name', message: 'Category name cannot be empty' }]);
        }

        // Check for duplicate name
        if (category_name && category_name.trim() !== category.category_name) {
            const existingCategory = await Category.findOne({
                where: { category_name: category_name.trim() }
            });

            if (existingCategory) {
                if (req.file) {
                    deleteFile(req.file.path);
                }
                return sendError(res, 'Category name already exists', 409);
            }
        }

        // Prepare update data
        const updateData = {};
        if (category_name) updateData.category_name = category_name.trim();
        if (status !== undefined) updateData.status = status;

        // Handle time_slots update
        if (time_slots !== undefined) {
            let parsedTimeSlots = [];
            if (typeof time_slots === 'string') {
                try {
                    parsedTimeSlots = JSON.parse(time_slots);
                } catch (e) {
                    // If it's a comma-separated string like "09:00,12:00,18:00"
                    parsedTimeSlots = time_slots.split(',').map(t => t.trim());
                }
            } else if (Array.isArray(time_slots)) {
                parsedTimeSlots = time_slots;
            }
            updateData.time_slots = parsedTimeSlots;
        }

        // Handle image update
        if (req.file) {
            // Delete old image if exists
            if (category.category_image) {
                const oldImagePath = path.join(__dirname, '../../uploads/categories', category.category_image);
                deleteFile(oldImagePath);
            }
            updateData.category_image = req.file.filename;
        }

        // Update category
        await category.update(updateData);

        // Parse time_slots for response
        let timeSlots = category.time_slots || [];
        if (typeof timeSlots === 'string') {
            try {
                timeSlots = JSON.parse(timeSlots);
            } catch (e) {
                timeSlots = [];
            }
        }

        // Prepare response
        const responseData = {
            id: category.id,
            category_name: category.category_name,
            category_image: getFileUrl(category.category_image),
            time_slots: timeSlots,
            status: category.status,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        };

        return sendSuccess(res, 'Category updated successfully', {
            category: responseData
        });

    } catch (error) {
        console.error('Update category error:', error);
        if (req.file) {
            deleteFile(req.file.path);
        }
        return sendError(res, 'An error occurred while updating category.');
    }
};

module.exports = {
    updateCategory
};
