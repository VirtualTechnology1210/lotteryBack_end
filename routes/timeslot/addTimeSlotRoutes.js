/**
 * Add TimeSlot Routes
 */

const express = require('express');
const router = express.Router();

const { addTimeSlot, bulkAddTimeSlots } = require('../../controller/timeslot/addController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   POST /api/timeslots/bulk
 * @desc    Bulk create time slots
 * @access  Admin only
 */
router.post('/bulk', authenticate, requireAdmin, bulkAddTimeSlots);

/**
 * @route   POST /api/timeslots
 * @desc    Create a new time slot
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, addTimeSlot);

module.exports = router;
