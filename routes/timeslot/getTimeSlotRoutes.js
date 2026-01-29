/**
 * Get TimeSlot Routes
 */

const express = require('express');
const router = express.Router();

const { getAllTimeSlots, getTimeSlotsByCategory, getTimeSlotById } = require('../../controller/timeslot/getController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   GET /api/timeslots/category/:categoryId
 * @desc    Get time slots by category ID
 * @access  Admin only
 */
router.get('/category/:categoryId', authenticate, requireAdmin, getTimeSlotsByCategory);

/**
 * @route   GET /api/timeslots
 * @desc    Get all time slots
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, getAllTimeSlots);

/**
 * @route   GET /api/timeslots/:id
 * @desc    Get time slot by ID
 * @access  Admin only
 */
router.get('/:id', authenticate, requireAdmin, getTimeSlotById);

module.exports = router;
