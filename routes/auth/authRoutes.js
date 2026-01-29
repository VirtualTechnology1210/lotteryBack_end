/**
 * Auth Routes Index
 * Combines all authentication related routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const loginRoutes = require('./loginRoutes');
const logoutRoutes = require('./logoutRoutes');
const profileRoutes = require('./profileRoutes');

// Mount routes
router.use('/login', loginRoutes);
router.use('/logout', logoutRoutes);
router.use('/profile', profileRoutes);

module.exports = router;
