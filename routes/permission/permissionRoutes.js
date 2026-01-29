/**
 * Permission Routes Index
 * Combines all permission management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addPermissionRoutes = require('./addPermissionRoutes');
const getPermissionRoutes = require('./getPermissionRoutes');
const deletePermissionRoutes = require('./deletePermissionRoutes');

// Mount routes - order matters for route matching
router.use('/', getPermissionRoutes);       // GET /api/permissions, GET /api/permissions/my, GET /api/permissions/role/:roleId
router.use('/', addPermissionRoutes);       // POST /api/permissions, POST /api/permissions/bulk
router.use('/', deletePermissionRoutes);    // DELETE /api/permissions/:id, DELETE /api/permissions/role/:roleId

module.exports = router;
