/**
 * Product Routes Index
 * Combines all product management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addProductRoutes = require('./addProductRoutes');
const getProductRoutes = require('./getProductRoutes');
const updateProductRoutes = require('./updateProductRoutes');
const deleteProductRoutes = require('./deleteProductRoutes');

// Mount routes - order matters for route matching
router.use('/', getProductRoutes);       // GET /api/products, GET /api/products/active, GET /api/products/:id, GET /api/products/category/:categoryId
router.use('/', addProductRoutes);       // POST /api/products
router.use('/', updateProductRoutes);    // PUT /api/products/:id, PATCH /api/products/:id/status
router.use('/', deleteProductRoutes);    // DELETE /api/products/:id, DELETE /api/products/:id/soft

module.exports = router;
