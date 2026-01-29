/**
 * Standardized API Response Utilities
 * Provides consistent response format across all API endpoints
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} errors - Additional error details
 */
const sendError = (res, message, statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
const sendValidationError = (res, errors) => {
    return sendError(res, 'Validation failed', 422, errors);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Name of the resource not found
 */
const sendNotFound = (res, resource = 'Resource') => {
    return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Custom unauthorized message
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Custom forbidden message
 */
const sendForbidden = (res, message = 'Access forbidden') => {
    return sendError(res, message, 403);
};

module.exports = {
    sendSuccess,
    sendError,
    sendValidationError,
    sendNotFound,
    sendUnauthorized,
    sendForbidden
};
