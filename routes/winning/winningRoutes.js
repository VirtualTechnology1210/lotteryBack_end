/**
 * Winning Routes
 * Routes for lottery winning number verification
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { canView } = require('../../middleware/permissionMiddleware');
const { checkWinning } = require('../../controller/winning/checkController');

/**
 * POST /api/winning/check
 * Check if a lottery number is a winner within the category's time-slot window
 * Requires: authentication + winning view permission
 */
router.post('/check', authenticate, canView('Winning'), checkWinning);

module.exports = router;
