/**
 * TimeSlot Routes Index
 * Combines all time slot management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addTimeSlotRoutes = require('./addTimeSlotRoutes');
const getTimeSlotRoutes = require('./getTimeSlotRoutes');
const updateTimeSlotRoutes = require('./updateTimeSlotRoutes');
const deleteTimeSlotRoutes = require('./deleteTimeSlotRoutes');

// Mount routes - order matters for route matching
router.use('/', addTimeSlotRoutes);       // POST /api/timeslots, POST /api/timeslots/bulk
router.use('/', getTimeSlotRoutes);       // GET /api/timeslots, GET /api/timeslots/category/:categoryId, GET /api/timeslots/:id
router.use('/', updateTimeSlotRoutes);    // PUT /api/timeslots/:id
router.use('/', deleteTimeSlotRoutes);    // DELETE /api/timeslots/:id, DELETE /api/timeslots/category/:categoryId

module.exports = router;
