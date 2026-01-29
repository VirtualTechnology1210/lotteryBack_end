/**
 * Delete Sales Routes
 */

const express = require('express');
const router = express.Router();

const { deleteSale } = require('../../controller/sales/deleteController');
const { authenticate } = require('../../middleware/authMiddleware');

/**
 * @route   DELETE /api/sales/:id
 * @desc    Delete a sale entry
 * @access  Admin or Owner
 */
router.delete('/:id', authenticate, deleteSale);

module.exports = router;
