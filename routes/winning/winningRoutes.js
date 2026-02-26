/**
 * Winning Routes
 * Routes for lottery winning number verification, submission, and summary
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { canView, canAdd } = require('../../middleware/permissionMiddleware');
const { checkWinning } = require('../../controller/winning/checkController');
const { submitWinning, getEntryForWindow, getWinningSummary, cancelWinningEntry } = require('../../controller/winning/submitController');

/**
 * POST /api/winning/check
 * Check if a lottery number is a winner within the category's time-slot window
 * Requires: authentication + winning view permission
 */
router.post('/check', authenticate, canView('Winning'), checkWinning);

/**
 * POST /api/winning/submit
 * Save a confirmed winning entry to the database
 * Requires: authentication + winning add permission
 */
router.post('/submit', authenticate, canAdd('Winning'), submitWinning);

/**
 * GET /api/winning/entry/:category_id
 * Get existing winning entry for a specific category + time window
 * Query params: window_start, window_end (ISO strings)
 * Requires: authentication + winning view permission
 */
router.get('/entry/:category_id', authenticate, canView('Winning'), getEntryForWindow);

/**
 * GET /api/winning/summary
 * Get aggregated winning summary for a date (defaults to today)
 * Query params: date (optional, YYYY-MM-DD)
 * Requires: authentication + winning view permission
 */
router.get('/summary', authenticate, canView('Winning'), getWinningSummary);

/**
 * PUT /api/winning/cancel/:id
 * Cancel (void) a wrong winning entry
 * Requires: authentication + winning add permission
 */
router.put('/cancel/:id', authenticate, canAdd('Winning'), cancelWinningEntry);

module.exports = router;
