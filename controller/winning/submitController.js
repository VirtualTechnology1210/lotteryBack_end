/**
 * Winning Submit Controller
 * Handles saving officially declared winning entries and retrieving them.
 * 
 * BUSINESS RULES:
 *   1. Multiple winning entries are allowed per category per time window.
 *   2. An admin can cancel a wrong submission (status → 'cancelled'),
 *      then re-submit with the correct number.
 *   3. The submit endpoint accepts the check results (already calculated
 *      by checkController) — winners count, payout, and rounds data.
 *   4. Total sales and balance are calculated on-the-fly from the Sales table
 *      in the summary endpoint, not stored in the winning entry.
 */

const { WinningEntry, Category, User, Sales, Product, sequelize } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Submit (save) a winning entry after the user has checked and confirmed it.
 * 
 * @route POST /api/winning/submit
 * @access Authenticated users with winning/add permission
 * 
 * Request body: {
 *   category_id,
 *   lottery_number,
 *   time_slot,
 *   window_start,      (ISO string)
 *   window_end,        (ISO string)
 *   total_winners,
 *   grand_total_winning_amount,
 *   rounds_data        (JSON — the rounds array from check results)
 * }
 */
const submitWinning = async (req, res) => {
    try {
        const {
            category_id,
            lottery_number,
            time_slot,
            window_start,
            window_end,
            total_winners,
            grand_total_winning_amount,
            rounds_data
        } = req.body;

        // ── Validation ──────────────────────────────────────────────
        if (!category_id) {
            return sendValidationError(res, [{ field: 'category_id', message: 'Category is required' }]);
        }
        if (!lottery_number || typeof lottery_number !== 'string' || !lottery_number.trim()) {
            return sendValidationError(res, [{ field: 'lottery_number', message: 'Lottery number is required' }]);
        }
        if (!time_slot) {
            return sendValidationError(res, [{ field: 'time_slot', message: 'Time slot is required' }]);
        }
        if (!window_start || !window_end) {
            return sendValidationError(res, [{ field: 'window', message: 'Window start and end are required' }]);
        }

        // Validate category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return sendError(res, 'Category not found', 404);
        }

        // Parse window dates
        const wsDate = new Date(window_start);
        const weDate = new Date(window_end);
        if (isNaN(wsDate.getTime()) || isNaN(weDate.getTime())) {
            return sendValidationError(res, [{ field: 'window', message: 'Invalid window date format' }]);
        }

        // Multiple winning entries are allowed per category + window

        const winningAmount = parseFloat(grand_total_winning_amount) || 0;

        // ── Create the winning entry ────────────────────────────────
        const entry = await WinningEntry.create({
            category_id,
            lottery_number: lottery_number.trim(),
            time_slot,
            window_start: wsDate,
            window_end: weDate,
            total_winners: parseInt(total_winners) || 0,
            grand_total_winning_amount: winningAmount,
            rounds_data: rounds_data || null,
            status: 'active',
            submitted_by: req.user.id
        });

        console.log(`[Winning] Entry submitted: ID=${entry.id}, Category=${category.category_name}, Number=${lottery_number}, By=${req.user.name || req.user.id}`);

        return sendSuccess(res, 'Winning entry submitted successfully', {
            id: entry.id,
            category_name: category.category_name,
            lottery_number: entry.lottery_number,
            time_slot: entry.time_slot,
            grand_total_winning_amount: parseFloat(entry.grand_total_winning_amount),
            status: entry.status,
            submitted_at: entry.createdAt
        }, 201);

    } catch (error) {
        console.error('Submit winning error:', error);
        return sendError(res, 'An error occurred while submitting the winning entry.');
    }
};

/**
 * Get existing winning entry for a category's current time window.
 * Used by frontend to check if a winning entry was already submitted
 * before showing the input form.
 * 
 * @route GET /api/winning/entry/:category_id
 * @access Authenticated users with winning/view permission
 * 
 * Query params: window_start, window_end (ISO strings)
 */
const getEntryForWindow = async (req, res) => {
    try {
        const { category_id } = req.params;
        const { window_start, window_end } = req.query;

        if (!category_id || !window_start || !window_end) {
            return sendValidationError(res, [{ field: 'params', message: 'category_id, window_start, and window_end are required' }]);
        }

        const wsDate = new Date(window_start);
        const weDate = new Date(window_end);
        if (isNaN(wsDate.getTime()) || isNaN(weDate.getTime())) {
            return sendValidationError(res, [{ field: 'window', message: 'Invalid window date format' }]);
        }

        const entry = await WinningEntry.findOne({
            where: {
                category_id,
                window_start: wsDate,
                window_end: weDate,
                status: 'active'
            },
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                },
                {
                    model: User,
                    as: 'submittedBy',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!entry) {
            return sendSuccess(res, 'No winning entry found for this window', { entry: null });
        }

        return sendSuccess(res, 'Winning entry found', {
            entry: {
                id: entry.id,
                category_id: entry.category_id,
                category_name: entry.category?.category_name || '-',
                lottery_number: entry.lottery_number,
                time_slot: entry.time_slot,
                window_start: entry.window_start,
                window_end: entry.window_end,
                total_winners: entry.total_winners,
                grand_total_winning_amount: parseFloat(entry.grand_total_winning_amount),
                rounds_data: entry.rounds_data,
                status: entry.status,
                submitted_by: entry.submittedBy?.name || '-',
                submitted_at: entry.createdAt
            }
        });

    } catch (error) {
        console.error('Get winning entry error:', error);
        return sendError(res, 'An error occurred while fetching the winning entry.');
    }
};

/**
 * Get winning summary for a date or date range.
 * 
 * CALCULATION:
 *   Total Sales Prize  = SUM(price) from Sales table for the date range
 *   Winning Amount     = SUM(grand_total_winning_amount) from WinningEntry table
 *   Balance            = Total Sales Prize - Winning Amount
 * 
 * @route GET /api/winning/summary
 * @access Authenticated users with winning/view permission
 * 
 * Query params: 
 *   date (optional, YYYY-MM-DD, defaults to today) — single day
 *   start_date, end_date (optional, YYYY-MM-DD) — date range (overrides 'date')
 */
const getWinningSummary = async (req, res) => {
    try {
        const { date, start_date, end_date } = req.query;

        let dayStart, dayEnd, displayStartDate, displayEndDate;

        if (start_date && end_date) {
            // Date range mode
            dayStart = new Date(start_date + 'T00:00:00+05:30');
            dayEnd = new Date(end_date + 'T00:00:00+05:30');
            dayEnd.setDate(dayEnd.getDate() + 1); // Include the end date fully
            displayStartDate = start_date;
            displayEndDate = end_date;
        } else {
            // Single date mode (backwards compatible)
            let targetDate;
            if (date) {
                targetDate = new Date(date + 'T00:00:00+05:30');
            } else {
                const now = new Date();
                targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            }
            dayStart = new Date(targetDate);
            dayEnd = new Date(targetDate);
            dayEnd.setDate(dayEnd.getDate() + 1);
            displayStartDate = dayStart.toISOString().split('T')[0];
            displayEndDate = displayStartDate;
        }

        // ── 1. Total Sales Prize — directly from the Sales table ─────
        // SUM(price) where price column stores (unit_price × qty) per row
        const salesResult = await Sales.findOne({
            where: {
                createdAt: {
                    [Op.gte]: dayStart,
                    [Op.lt]: dayEnd
                }
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('price')), 'total_sales_amount'],
                [sequelize.fn('SUM', sequelize.col('qty')), 'total_qty'],
            ],
            raw: true
        });

        const totalSalesAmount = parseFloat(salesResult?.total_sales_amount) || 0;
        const totalQty = parseInt(salesResult?.total_qty) || 0;

        // ── 2. Winning Amount — from WinningEntry table ─────────────
        const entries = await WinningEntry.findAll({
            where: {
                status: 'active',
                createdAt: {
                    [Op.gte]: dayStart,
                    [Op.lt]: dayEnd
                }
            },
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'category_name']
                },
                {
                    model: User,
                    as: 'submittedBy',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        let totalWinningAmount = 0;

        const entrySummaries = entries.map(entry => {
            const winAmt = parseFloat(entry.grand_total_winning_amount) || 0;
            totalWinningAmount += winAmt;

            return {
                id: entry.id,
                category_name: entry.category?.category_name || '-',
                lottery_number: entry.lottery_number,
                time_slot: entry.time_slot,
                total_winners: entry.total_winners,
                grand_total_winning_amount: winAmt,
                rounds_data: entry.rounds_data,
                submitted_by: entry.submittedBy?.name || '-',
                submitted_at: entry.createdAt
            };
        });

        // ── 3. Balance ──────────────────────────────────────────────
        const totalBalance = totalSalesAmount - totalWinningAmount;

        return sendSuccess(res, 'Winning summary retrieved', {
            start_date: displayStartDate,
            end_date: displayEndDate,
            total_entries: entries.length,
            total_sales_amount: totalSalesAmount,
            total_qty: totalQty,
            total_winning_amount: totalWinningAmount,
            total_balance: totalBalance,
            entries: entrySummaries
        });

    } catch (error) {
        console.error('Get winning summary error:', error);
        return sendError(res, 'An error occurred while fetching the winning summary.');
    }
};

/**
 * Cancel a winning entry (set status to 'cancelled').
 * This allows the user to re-submit with a corrected number.
 * 
 * @route PUT /api/winning/cancel/:id
 * @access Authenticated users with winning/add permission
 */
const cancelWinningEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await WinningEntry.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'category_name']
            }]
        });

        if (!entry) {
            return sendError(res, 'Winning entry not found', 404);
        }

        if (entry.status === 'cancelled') {
            return sendError(res, 'This winning entry is already cancelled', 400);
        }

        entry.status = 'cancelled';
        await entry.save();

        console.log(`[Winning] Entry cancelled: ID=${entry.id}, By=${req.user.name || req.user.id}`);

        return sendSuccess(res, 'Winning entry cancelled successfully', {
            id: entry.id,
            category_name: entry.category?.category_name || '-',
            lottery_number: entry.lottery_number,
            status: 'cancelled'
        });

    } catch (error) {
        console.error('Cancel winning entry error:', error);
        return sendError(res, 'An error occurred while cancelling the winning entry.');
    }
};

module.exports = {
    submitWinning,
    getEntryForWindow,
    getWinningSummary,
    cancelWinningEntry
};
