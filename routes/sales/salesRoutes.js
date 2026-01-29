/**
 * Sales Routes Index
 * Combines all sales management routes
 */

const express = require('express');
const router = express.Router();

// Import individual route modules
const addSalesRoutes = require('./addSalesRoutes');
const getSalesRoutes = require('./getSalesRoutes');
const updateSalesRoutes = require('./updateSalesRoutes');
const deleteSalesRoutes = require('./deleteSalesRoutes');
const reportRoutes = require('./reportRoutes');

// Mount routes - order matters for route matching
// Report routes must come first to avoid /report matching /:id
router.use('/report', reportRoutes);   // GET /api/sales/report, GET /api/sales/report/by-category, GET /api/sales/report/by-user
router.use('/', getSalesRoutes);       // GET /api/sales, GET /api/sales/my-sales, GET /api/sales/:id
router.use('/', addSalesRoutes);       // POST /api/sales
router.use('/', updateSalesRoutes);    // PUT /api/sales/:id
router.use('/', deleteSalesRoutes);    // DELETE /api/sales/:id

module.exports = router;

