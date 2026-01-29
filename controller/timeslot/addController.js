/**
 * Add TimeSlot Controller
 * Handles creating new time slots for categories
 */

const { TimeSlot, Category } = require('../../models');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Create a new time slot
 * @route POST /api/timeslots
 * @access Admin only
 */
const addTimeSlot = async (req, res) => {
    try {
        const { category_id, slot_date, slot_time, status } = req.body;

        // Validate required fields
        const errors = [];
        if (!category_id) {
            errors.push({ field: 'category_id', message: 'Category ID is required' });
        }
        if (!slot_date) {
            errors.push({ field: 'slot_date', message: 'Slot date is required' });
        }
        if (!slot_time) {
            errors.push({ field: 'slot_time', message: 'Slot time is required' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Verify category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return sendNotFound(res, 'Category');
        }

        // Check if category is active
        if (category.status !== 1) {
            return sendError(res, 'Category is inactive. Cannot add slots.', 400);
        }

        // Check if time slot already exists for this category and date
        const existingSlot = await TimeSlot.findOne({
            where: {
                category_id,
                slot_date,
                slot_time
            }
        });

        if (existingSlot) {
            return sendError(res, 'Time slot already exists for this category and date/time', 409);
        }

        // Create time slot
        const timeSlot = await TimeSlot.create({
            category_id,
            slot_date,
            slot_time,
            status: status !== undefined ? status : 1
        });

        // Fetch with category info
        const createdSlot = await TimeSlot.findByPk(timeSlot.id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }]
        });

        return sendSuccess(res, 'Time slot created successfully', {
            timeSlot: createdSlot
        }, 201);

    } catch (error) {
        console.error('Add time slot error:', error);
        return sendError(res, 'An error occurred while creating time slot.');
    }
};

/**
 * Bulk create time slots
 * @route POST /api/timeslots/bulk
 * @access Admin only
 */
const bulkAddTimeSlots = async (req, res) => {
    try {
        const { category_id, slots } = req.body;

        // Validate
        if (!category_id) {
            return sendValidationError(res, [{ field: 'category_id', message: 'Category ID is required' }]);
        }
        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return sendValidationError(res, [{ field: 'slots', message: 'Slots array is required' }]);
        }

        // Verify category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return sendNotFound(res, 'Category');
        }

        if (category.status !== 1) {
            return sendError(res, 'Category is inactive. Cannot add slots.', 400);
        }

        const results = [];
        for (const slot of slots) {
            const { slot_date, slot_time, status } = slot;

            if (!slot_date) continue;

            // Check for existing slot
            const existing = await TimeSlot.findOne({
                where: {
                    category_id,
                    slot_date,
                    slot_time
                }
            });

            if (existing) {
                results.push({
                    slot_date,
                    slot_time,
                    status: 'exists'
                });
                continue;
            }

            // Create slot
            await TimeSlot.create({
                category_id,
                slot_date,
                slot_time,
                status: status !== undefined ? status : 1
            });

            results.push({
                slot_date,
                slot_time,
                status: 'created'
            });
        }

        return sendSuccess(res, 'Time slots processed successfully', {
            category_id,
            category_name: category.category_name,
            processed: results.length,
            results
        }, 201);

    } catch (error) {
        console.error('Bulk add time slots error:', error);
        return sendError(res, 'An error occurred while creating time slots.');
    }
};

module.exports = {
    addTimeSlot,
    bulkAddTimeSlots
};
