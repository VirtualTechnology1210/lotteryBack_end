/**
 * Delete TimeSlot Controller
 * Handles deleting time slots
 */

const { TimeSlot, Category } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Delete time slot by ID
 * @route DELETE /api/timeslots/:id
 * @access Admin only
 */
const deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;

        // Find time slot
        const timeSlot = await TimeSlot.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }]
        });

        if (!timeSlot) {
            return sendNotFound(res, 'Time slot');
        }

        // Store info for response
        const deletedSlotInfo = {
            id: timeSlot.id,
            category_name: timeSlot.category ? timeSlot.category.category_name : null,
            slot_date: timeSlot.slot_date,
            slot_time: timeSlot.slot_time
        };

        // Delete time slot
        await timeSlot.destroy();

        return sendSuccess(res, 'Time slot deleted successfully', {
            deletedTimeSlot: deletedSlotInfo
        });

    } catch (error) {
        console.error('Delete time slot error:', error);
        return sendError(res, 'An error occurred while deleting time slot.');
    }
};

/**
 * Delete all time slots by category
 * @route DELETE /api/timeslots/category/:categoryId
 * @access Admin only
 */
const deleteTimeSlotsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Verify category exists
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return sendNotFound(res, 'Category');
        }

        // Delete all time slots for this category
        const deletedCount = await TimeSlot.destroy({
            where: { category_id: categoryId }
        });

        return sendSuccess(res, 'Time slots deleted successfully', {
            category_name: category.category_name,
            deletedCount
        });

    } catch (error) {
        console.error('Delete time slots by category error:', error);
        return sendError(res, 'An error occurred while deleting time slots.');
    }
};

module.exports = {
    deleteTimeSlot,
    deleteTimeSlotsByCategory
};
