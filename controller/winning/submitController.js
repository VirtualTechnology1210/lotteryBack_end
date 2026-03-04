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
        const { date, start_date, end_date, category_id } = req.query;

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
        const salesWhere = {
            createdAt: {
                [Op.gte]: dayStart,
                [Op.lt]: dayEnd
            }
        };
        const salesInclude = [];
        if (category_id) {
            salesInclude.push({
                model: Product,
                as: 'product',
                attributes: [],
                where: { category_id: category_id },
                required: true
            });
        }

        const salesResult = await Sales.findOne({
            where: salesWhere,
            include: salesInclude,
            attributes: [
                [sequelize.fn('SUM', sequelize.col('Sales.price')), 'total_sales_amount'],
                [sequelize.fn('SUM', sequelize.col('Sales.qty')), 'total_qty'],
            ],
            raw: true
        });

        const totalSalesAmount = parseFloat(salesResult?.total_sales_amount) || 0;
        const totalQty = parseInt(salesResult?.total_qty) || 0;

        // ── 1b. User-wise Sales — grouped by user_id ────────────────
        const userSalesInclude = [
            {
                model: User,
                as: 'createdBy',
                attributes: ['id', 'name']
            }
        ];
        const userSalesGroup = ['user_id', 'createdBy.id', 'createdBy.name'];
        if (category_id) {
            userSalesInclude.push({
                model: Product,
                as: 'product',
                attributes: [],
                where: { category_id: category_id },
                required: true
            });
        }

        const userSalesRows = await Sales.findAll({
            where: salesWhere,
            attributes: [
                'user_id',
                [sequelize.fn('SUM', sequelize.col('Sales.price')), 'total_sales_amount'],
            ],
            include: userSalesInclude,
            group: userSalesGroup,
            raw: true,
            nest: true
        });

        // Build a map: user_id -> { name, sales, winning }
        const userMap = {};
        for (const row of userSalesRows) {
            const userId = row.user_id;
            const userName = row.createdBy?.name || '-';
            const salesAmt = parseFloat(row.total_sales_amount) || 0;
            userMap[userId] = {
                user_id: userId,
                user_name: userName,
                total_sales: salesAmt,
                total_winning: 0
            };
        }

        // ── 2. Winning Amount — from WinningEntry table ─────────────
        const winningWhere = {
            status: 'active',
            createdAt: {
                [Op.gte]: dayStart,
                [Op.lt]: dayEnd
            }
        };
        if (category_id) {
            winningWhere.category_id = category_id;
        }

        const entries = await WinningEntry.findAll({
            where: winningWhere,
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

        // ── 2b. User-wise Winning — extract from rounds_data ────────
        // rounds_data is JSON: [ { matches: [ { sold_by, total_winning_amount }, ... ] }, ... ]
        // For OLD entries that don't have 'matches', fallback: re-query Sales
        for (const entry of entries) {
            let roundsData = entry.rounds_data;
            let hasMatches = false;

            // Parse if stringified
            if (roundsData && typeof roundsData === 'string') {
                try { roundsData = JSON.parse(roundsData); } catch (e) { roundsData = null; }
            }

            // Check if rounds_data has matches arrays
            if (Array.isArray(roundsData)) {
                for (const round of roundsData) {
                    if (round.matches && Array.isArray(round.matches) && round.matches.length > 0) {
                        hasMatches = true;
                        break;
                    }
                }
            }

            if (hasMatches) {
                // ── NEW FORMAT: Extract user-wise winning from matches ──
                for (const round of roundsData) {
                    if (!round.matches || !Array.isArray(round.matches)) continue;
                    for (const match of round.matches) {
                        const soldByName = match.sold_by || '-';
                        const matchWinning = parseFloat(match.total_winning_amount) || 0;

                        // Find user in map by name
                        let foundUserId = null;
                        for (const uid of Object.keys(userMap)) {
                            if (userMap[uid].user_name === soldByName) {
                                foundUserId = uid;
                                break;
                            }
                        }

                        if (foundUserId) {
                            userMap[foundUserId].total_winning += matchWinning;
                        } else {
                            const tempId = `name_${soldByName}`;
                            if (!userMap[tempId]) {
                                userMap[tempId] = {
                                    user_id: tempId,
                                    user_name: soldByName,
                                    total_sales: 0,
                                    total_winning: 0
                                };
                            }
                            userMap[tempId].total_winning += matchWinning;
                        }
                    }
                }
            } else {
                // ── OLD FORMAT FALLBACK: Re-query Sales to find who sold the winning number ──
                const entryWinAmt = parseFloat(entry.grand_total_winning_amount) || 0;
                if (entryWinAmt <= 0) continue;

                // Find sales within this entry's time window that match the winning number
                const winSales = await Sales.findAll({
                    where: {
                        createdAt: {
                            [Op.gte]: entry.window_start,
                            [Op.lt]: entry.window_end
                        }
                    },
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'category_id', 'digit_type', 'winning_amounts', 'index_type', 'box'],
                            where: { category_id: entry.category_id },
                            required: true
                        },
                        {
                            model: User,
                            as: 'createdBy',
                            attributes: ['id', 'name']
                        }
                    ]
                });

                const winNumber = entry.lottery_number.trim();
                const winLen = winNumber.length;

                // Re-run matching for this winning number against matching sales
                for (const sale of winSales) {
                    if (!sale.desc) continue;
                    const lotteryNumbers = sale.desc.split(',').map(n => n.trim()).filter(n => n.length > 0);
                    const isMultiNumber = lotteryNumbers.length > 1;
                    const perMatchQty = isMultiNumber ? 1 : (sale.qty || 1);

                    const productIndexType = sale.product?.index_type || null;

                    for (const num of lotteryNumbers) {
                        let matchWinning = 0;

                        if (productIndexType) {
                            // Index-type matching
                            const last3 = winNumber.length >= 3 ? winNumber.slice(-3) : winNumber;
                            const indexDigits = {};
                            if (last3.length >= 1) indexDigits['C'] = last3.slice(-1);
                            if (last3.length >= 2) indexDigits['B'] = last3.slice(-2, -1);
                            if (last3.length >= 3) indexDigits['A'] = last3.slice(-3, -2);
                            if (indexDigits['A'] && indexDigits['B']) indexDigits['AB'] = indexDigits['A'] + indexDigits['B'];
                            if (indexDigits['B'] && indexDigits['C']) indexDigits['BC'] = indexDigits['B'] + indexDigits['C'];
                            if (indexDigits['A'] && indexDigits['C']) indexDigits['AC'] = indexDigits['A'] + indexDigits['C'];

                            const upperIdx = productIndexType.toUpperCase();
                            const expectedValue = indexDigits[upperIdx];
                            if (expectedValue && num === expectedValue) {
                                let wa = sale.product.winning_amounts;
                                while (typeof wa === 'string') { try { wa = JSON.parse(wa); } catch (e) { wa = null; break; } }
                                if (wa) matchWinning = (parseFloat(wa[String(sale.product.digit_type)]) || 0) * perMatchQty;
                            }
                            // Index products skip regular matching
                        } else {
                            // Regular suffix matching — same digit length only
                            if (num.length !== winLen) continue;

                            // Find highest matching round
                            for (let i = winLen; i >= 1; i--) {
                                const suffix = winNumber.slice(-i);
                                if (num.endsWith(suffix)) {
                                    let wa = sale.product.winning_amounts;
                                    while (typeof wa === 'string') { try { wa = JSON.parse(wa); } catch (e) { wa = null; break; } }
                                    if (wa) matchWinning = (parseFloat(wa[String(i)]) || 0) * perMatchQty;
                                    break; // Highest match only
                                }
                            }
                        }

                        if (matchWinning > 0) {
                            const soldByName = sale.createdBy?.name || '-';
                            let foundUserId = null;
                            for (const uid of Object.keys(userMap)) {
                                if (userMap[uid].user_name === soldByName) {
                                    foundUserId = uid;
                                    break;
                                }
                            }
                            if (foundUserId) {
                                userMap[foundUserId].total_winning += matchWinning;
                            } else {
                                const tempId = `name_${soldByName}`;
                                if (!userMap[tempId]) {
                                    userMap[tempId] = { user_id: tempId, user_name: soldByName, total_sales: 0, total_winning: 0 };
                                }
                                userMap[tempId].total_winning += matchWinning;
                            }
                        }
                    }
                }
            }
        }

        // Build user_wise array with balance
        const userWise = Object.values(userMap).map(u => ({
            user_name: u.user_name,
            total_sales: u.total_sales,
            total_winning: u.total_winning,
            balance: u.total_sales - u.total_winning
        }));

        // Sort by sales descending
        userWise.sort((a, b) => b.total_sales - a.total_sales);

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
            entries: entrySummaries,
            user_wise: userWise
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
