/**
 * Main Routes Index
 * Central routing configuration for all API endpoints
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth/authRoutes');
const userRoutes = require('./user/userRoutes');
const pageRoutes = require('./page/pageRoutes');
const permissionRoutes = require('./permission/permissionRoutes');
const categoryRoutes = require('./category/categoryRoutes');
const timeSlotRoutes = require('./timeslot/timeSlotRoutes');

// API health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Lottery API is running',
        timestamp: new Date().toISOString()
    });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pages', pageRoutes);
router.use('/permissions', permissionRoutes);
router.use('/categories', categoryRoutes);
router.use('/timeslots', timeSlotRoutes);

module.exports = router;



