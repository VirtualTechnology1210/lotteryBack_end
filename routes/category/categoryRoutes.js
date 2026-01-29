/**
 * Category Routes Index
 * Combines all category management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addCategoryRoutes = require('./addCategoryRoutes');
const getCategoryRoutes = require('./getCategoryRoutes');
const updateCategoryRoutes = require('./updateCategoryRoutes');
const deleteCategoryRoutes = require('./deleteCategoryRoutes');

// Mount routes - order matters for route matching
router.use('/', getCategoryRoutes);       // GET /api/categories, GET /api/categories/active, GET /api/categories/:id
router.use('/', addCategoryRoutes);       // POST /api/categories
router.use('/', updateCategoryRoutes);    // PUT /api/categories/:id
router.use('/', deleteCategoryRoutes);    // DELETE /api/categories/:id

module.exports = router;
