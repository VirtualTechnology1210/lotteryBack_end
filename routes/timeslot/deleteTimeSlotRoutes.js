/**
 * Delete TimeSlot Routes
 */

const express = require('express');
const router = express.Router();

const { deleteTimeSlot, deleteTimeSlotsByCategory } = require('../../controller/timeslot/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requireAdmin } = require('../../middleware/rbacMiddleware');

/**
 * @route   DELETE /api/timeslots/category/:categoryId
 * @desc    Delete all time slots for a category
 * @access  Admin only
 */
router.delete('/category/:categoryId', authenticate, requireAdmin, deleteTimeSlotsByCategory);

/**
 * @route   DELETE /api/timeslots/:id
 * @desc    Delete time slot by ID
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteTimeSlot);

module.exports = router;
