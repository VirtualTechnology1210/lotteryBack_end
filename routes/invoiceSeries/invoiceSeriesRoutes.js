/**
 * Invoice Series Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { checkPermission } = require('../../middleware/permissionMiddleware');
const invoiceSeriesController = require('../../controller/invoiceSeries/invoiceSeriesController');

// All routes require authentication
router.use(authenticate);

// Get all invoice series
router.get('/', invoiceSeriesController.getAllSeries);

// Get single invoice series by ID
router.get('/:id', invoiceSeriesController.getSeriesById);

// Create new invoice series (Admin only)
router.post('/', checkPermission('roles & permissions', 'add'), invoiceSeriesController.createSeries);

// Update invoice series (Admin only)
router.put('/:id', checkPermission('roles & permissions', 'edit'), invoiceSeriesController.updateSeries);

// Delete invoice series (Admin only)
router.delete('/:id', checkPermission('roles & permissions', 'del'), invoiceSeriesController.deleteSeries);

module.exports = router;
