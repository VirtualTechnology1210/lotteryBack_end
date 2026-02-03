/**
 * Role Routes Index
 * Combines all role management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const getRoleRoutes = require('./getRoleRoutes');

// Mount routes
router.use('/', getRoleRoutes);       // GET /api/roles, GET /api/roles/:id

module.exports = router;
