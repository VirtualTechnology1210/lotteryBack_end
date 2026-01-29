/**
 * Get TimeSlot Controller
 * Handles fetching time slots
 */

const { TimeSlot, Category } = require('../../models');
const { sendSuccess, sendError, sendNotFound } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Get all time slots
 * @route GET /api/timeslots
 * @access Admin only
 */
const getAllTimeSlots = async (req, res) => {
    try {
        const { category_id, status, from_date, to_date } = req.query;

        const whereClause = {};
        if (category_id) whereClause.category_id = category_id;
        if (status !== undefined) whereClause.status = status;

        // Date range filter
        if (from_date || to_date) {
            whereClause.slot_date = {};
            if (from_date) whereClause.slot_date[Op.gte] = from_date;
            if (to_date) whereClause.slot_date[Op.lte] = to_date;
        }

        const timeSlots = await TimeSlot.findAll({
            where: whereClause,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }],
            order: [['slot_date', 'ASC'], ['slot_time', 'ASC']]
        });

        return sendSuccess(res, 'Time slots fetched successfully', {
            count: timeSlots.length,
            timeSlots
        });

    } catch (error) {
        console.error('Get all time slots error:', error);
        return sendError(res, 'An error occurred while fetching time slots.');
    }
};

/**
 * Get time slots by category ID
 * @route GET /api/timeslots/category/:categoryId
 * @access Admin only
 */
const getTimeSlotsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { status } = req.query;

        // Verify category exists
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return sendNotFound(res, 'Category');
        }

        const whereClause = { category_id: categoryId };
        if (status !== undefined) whereClause.status = status;

        const timeSlots = await TimeSlot.findAll({
            where: whereClause,
            order: [['slot_date', 'ASC'], ['slot_time', 'ASC']]
        });

        return sendSuccess(res, 'Time slots fetched successfully', {
            category: {
                id: category.id,
                category_name: category.category_name
            },
            count: timeSlots.length,
            timeSlots
        });

    } catch (error) {
        console.error('Get time slots by category error:', error);
        return sendError(res, 'An error occurred while fetching time slots.');
    }
};

/**
 * Get single time slot by ID
 * @route GET /api/timeslots/:id
 * @access Admin only
 */
const getTimeSlotById = async (req, res) => {
    try {
        const { id } = req.params;

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

        return sendSuccess(res, 'Time slot fetched successfully', {
            timeSlot
        });

    } catch (error) {
        console.error('Get time slot by ID error:', error);
        return sendError(res, 'An error occurred while fetching time slot.');
    }
};

module.exports = {
    getAllTimeSlots,
    getTimeSlotsByCategory,
    getTimeSlotById
};
