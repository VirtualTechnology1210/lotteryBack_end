/**
 * User Routes Index
 * Combines all user management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addUserRoutes = require('./addUserRoutes');
const getUserRoutes = require('./getUserRoutes');
const updateUserRoutes = require('./updateUserRoutes');
const deleteUserRoutes = require('./deleteUserRoutes');

// Mount routes - all user operations under /api/users
router.use('/', addUserRoutes);      // POST /api/users
router.use('/', getUserRoutes);       // GET /api/users, GET /api/users/:id
router.use('/', updateUserRoutes);    // PUT /api/users/:id
router.use('/', deleteUserRoutes);    // DELETE /api/users/:id

module.exports = router;
