/**
 * Update TimeSlot Controller
 * Handles updating time slots
 */

const { TimeSlot, Category } = require('../../models');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../../utils/responseUtils');

/**
 * Update time slot by ID
 * @route PUT /api/timeslots/:id
 * @access Admin only
 */
const updateTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, slot_date, slot_time, status } = req.body;

        // Find time slot
        const timeSlot = await TimeSlot.findByPk(id);

        if (!timeSlot) {
            return sendNotFound(res, 'Time slot');
        }

        // If changing category, verify it exists
        if (category_id && category_id !== timeSlot.category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                return sendNotFound(res, 'Category');
            }
            if (category.status !== 1) {
                return sendError(res, 'Category is inactive. Cannot move slot to this category.', 400);
            }
        }

        // Check for duplicate if date/time changed
        if (slot_date || slot_time !== undefined) {
            const checkCategoryId = category_id || timeSlot.category_id;
            const checkDate = slot_date || timeSlot.slot_date;
            const checkTime = slot_time !== undefined ? slot_time : timeSlot.slot_time;

            const existingSlot = await TimeSlot.findOne({
                where: {
                    category_id: checkCategoryId,
                    slot_date: checkDate,
                    slot_time: checkTime,
                    id: { [require('sequelize').Op.ne]: id }
                }
            });

            if (existingSlot) {
                return sendError(res, 'Time slot already exists for this category and date/time', 409);
            }
        }

        // Prepare update data
        const updateData = {};
        if (category_id) updateData.category_id = category_id;
        if (slot_date) updateData.slot_date = slot_date;
        if (slot_time !== undefined) updateData.slot_time = slot_time;
        if (status !== undefined) updateData.status = status;

        // Update time slot
        await timeSlot.update(updateData);

        // Fetch updated slot with category
        const updatedSlot = await TimeSlot.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }]
        });

        return sendSuccess(res, 'Time slot updated successfully', {
            timeSlot: updatedSlot
        });

    } catch (error) {
        console.error('Update time slot error:', error);
        return sendError(res, 'An error occurred while updating time slot.');
    }
};

module.exports = {
    updateTimeSlot
};
