/**
 * Invoice Series Controller
 * Handles CRUD operations for invoice series
 */

const { InvoiceSeries } = require('../../models');
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../../utils/responseUtils');

/**
 * Get all invoice series
 * @route GET /api/invoice-series
 */
const getAllSeries = async (req, res) => {
    try {
        const series = await InvoiceSeries.findAll({
            order: [['series_name', 'ASC']]
        });

        return sendSuccess(res, 'Invoice series retrieved successfully', {
            series
        });
    } catch (error) {
        console.error('Get all invoice series error:', error);
        return sendError(res, 'An error occurred while fetching invoice series.');
    }
};

/**
 * Get single invoice series by ID
 * @route GET /api/invoice-series/:id
 */
const getSeriesById = async (req, res) => {
    try {
        const { id } = req.params;

        const series = await InvoiceSeries.findByPk(id);

        if (!series) {
            return sendNotFound(res, 'Invoice series');
        }

        return sendSuccess(res, 'Invoice series retrieved successfully', {
            series
        });
    } catch (error) {
        console.error('Get invoice series by ID error:', error);
        return sendError(res, 'An error occurred while fetching invoice series.');
    }
};

/**
 * Create new invoice series
 * @route POST /api/invoice-series
 */
const createSeries = async (req, res) => {
    try {
        const { series_name, next_number } = req.body;

        // Validation
        const errors = [];
        if (!series_name || !series_name.trim()) {
            errors.push({ field: 'series_name', message: 'Series name is required' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Check if series name already exists
        const existing = await InvoiceSeries.findOne({
            where: { series_name: series_name.trim().toLowerCase() }
        });

        if (existing) {
            return sendError(res, 'Invoice series with this name already exists', 400);
        }

        const series = await InvoiceSeries.create({
            series_name: series_name.trim().toLowerCase(),
            next_number: next_number || 1
        });

        return sendSuccess(res, 'Invoice series created successfully', {
            series
        }, 201);
    } catch (error) {
        console.error('Create invoice series error:', error);
        return sendError(res, 'An error occurred while creating invoice series.');
    }
};

/**
 * Update invoice series
 * @route PUT /api/invoice-series/:id
 */
const updateSeries = async (req, res) => {
    try {
        const { id } = req.params;
        const { series_name, next_number } = req.body;

        const series = await InvoiceSeries.findByPk(id);

        if (!series) {
            return sendNotFound(res, 'Invoice series');
        }

        // Validation
        const errors = [];
        if (series_name !== undefined && !series_name.trim()) {
            errors.push({ field: 'series_name', message: 'Series name cannot be empty' });
        }
        if (next_number !== undefined && (isNaN(next_number) || parseInt(next_number) < 1)) {
            errors.push({ field: 'next_number', message: 'Next number must be at least 1' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Check for duplicate name if being changed
        if (series_name && series_name.trim().toLowerCase() !== series.series_name) {
            const existing = await InvoiceSeries.findOne({
                where: { series_name: series_name.trim().toLowerCase() }
            });

            if (existing) {
                return sendError(res, 'Invoice series with this name already exists', 400);
            }
        }

        // Update fields
        if (series_name !== undefined) series.series_name = series_name.trim().toLowerCase();
        if (next_number !== undefined) series.next_number = parseInt(next_number);

        await series.save();

        return sendSuccess(res, 'Invoice series updated successfully', {
            series
        });
    } catch (error) {
        console.error('Update invoice series error:', error);
        return sendError(res, 'An error occurred while updating invoice series.');
    }
};

/**
 * Delete invoice series
 * @route DELETE /api/invoice-series/:id
 */
const deleteSeries = async (req, res) => {
    try {
        const { id } = req.params;

        const series = await InvoiceSeries.findByPk(id);

        if (!series) {
            return sendNotFound(res, 'Invoice series');
        }

        // Prevent deletion of default sales series
        if (series.series_name === 'sales') {
            return sendError(res, 'Cannot delete the default sales invoice series', 400);
        }

        await series.destroy();

        return sendSuccess(res, 'Invoice series deleted successfully');
    } catch (error) {
        console.error('Delete invoice series error:', error);
        return sendError(res, 'An error occurred while deleting invoice series.');
    }
};

module.exports = {
    getAllSeries,
    getSeriesById,
    createSeries,
    updateSeries,
    deleteSeries
};
