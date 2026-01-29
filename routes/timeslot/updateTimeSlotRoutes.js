/**
 * Update TimeSlot Routes
 */

const express = require('express');
const router = express.Router();

const { updateTimeSlot } = require('../../controller/timeslot/updateController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   PUT /api/timeslots/:id
 * @desc    Update time slot by ID
 * @access  Admin only
 */
router.put('/:id', authenticate, requireAdmin, updateTimeSlot);

module.exports = router;
