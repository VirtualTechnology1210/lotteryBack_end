/**
 * Page Routes Index
 * Combines all page management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addPageRoutes = require('./addPageRoutes');
const getPageRoutes = require('./getPageRoutes');
const updatePageRoutes = require('./updatePageRoutes');
const deletePageRoutes = require('./deletePageRoutes');

// Mount routes
router.use('/', addPageRoutes);       // POST /api/pages
router.use('/', getPageRoutes);       // GET /api/pages, GET /api/pages/:id
router.use('/', updatePageRoutes);    // PUT /api/pages/:id
router.use('/', deletePageRoutes);    // DELETE /api/pages/:id

module.exports = router;
