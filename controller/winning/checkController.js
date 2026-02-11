/**
 * Winning Check Controller
 * Handles lottery winning number verification against sales data
 * Uses time-slot-based 24-hour rolling window filtering
 * 
 * MATCHING LOGIC (Right-to-left suffix, highest round priority):
 *   Round 3: Exact match with entered number (highest priority)
 *   Round 2: Last 2 digits match
 *   Round 1: Last 1 digit match
 * 
 * Each lottery number is assigned to the HIGHEST round it qualifies for.
 */

const { Sales, Product, Category, User } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');
const { Op } = require('sequelize');

/**
 * Parse a time slot string like "3:00 PM" or "10:00 AM" into { hours, minutes } in 24-hour format
 */
const parseTimeSlot = (timeSlot) => {
    if (!timeSlot || typeof timeSlot !== 'string') return null;

    const trimmed = timeSlot.trim();

    // Try 12-hour format: "3:00 PM", "10:30 AM", "12:00 PM"
    const match12h = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12h) {
        let hours = parseInt(match12h[1], 10);
        const minutes = parseInt(match12h[2], 10);
        const meridiem = match12h[3].toUpperCase();

        if (meridiem === 'AM') {
            if (hours === 12) hours = 0;
        } else {
            if (hours !== 12) hours += 12;
        }

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return { hours, minutes };
        }
        return null;
    }

    // Try 24-hour format: "15:00", "09:30"
    const match24h = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24h) {
        const hours = parseInt(match24h[1], 10);
        const minutes = parseInt(match24h[2], 10);

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            return { hours, minutes };
        }
        return null;
    }

    return null;
};

/**
 * Calculate the 24-hour rolling time window based on a time slot.
 * 
 * The window is always exactly 24 hours and ends at the most recent
 * occurrence of the time slot that is NOT in the future.
 * 
 * Example (time slot = 3:00 PM):
 *   Current time 4:19 PM on Feb 11 → window: Feb 10 3PM → Feb 11 3PM
 *   Current time 1:00 PM on Feb 11 → window: Feb 9 3PM  → Feb 10 3PM
 */
const calculateTimeWindow = (timeSlotStr) => {
    const parsed = parseTimeSlot(timeSlotStr);
    if (!parsed) return null;

    const now = new Date();

    // Build today's cutoff at the time slot
    const todayCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parsed.hours, parsed.minutes, 0, 0);

    let windowEnd;
    if (now >= todayCutoff) {
        // Current time is at or past today's time slot → use today's cutoff as end
        windowEnd = todayCutoff;
    } else {
        // Current time is before today's time slot → use yesterday's cutoff as end
        windowEnd = new Date(todayCutoff);
        windowEnd.setDate(windowEnd.getDate() - 1);
    }

    // Start is exactly 24 hours before the end
    const windowStart = new Date(windowEnd);
    windowStart.setDate(windowStart.getDate() - 1);

    console.log(`[Winning] Time slot: ${timeSlotStr}, Now: ${now.toISOString()}`);
    console.log(`[Winning] Window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);

    return {
        start: windowStart,
        end: windowEnd
    };
};

/**
 * Transform a sale record for response
 */
const transformSale = (sale, lotteryNumber, matchRound) => ({
    id: sale.id,
    invoice_number: sale.invoice_number || 'N/A',
    product_name: sale.product?.product_name || '-',
    product_code: sale.product?.product_code || '-',
    desc: sale.desc,
    lottery_number: lotteryNumber,
    qty: sale.qty,
    price: parseFloat(sale.price),
    total: parseFloat(sale.price) * sale.qty,
    box: sale.product?.box || 0,
    sold_by: sale.createdBy?.name || '-',
    sold_at: sale.createdAt,
    match_round: matchRound
});

/**
 * Check lottery winning number against sales in the time-slot window
 * with round-based suffix matching (highest round priority)
 * 
 * @route POST /api/winning/check
 * @access Authenticated users with winning/view permission
 * 
 * Request body: { category_id, lottery_number }
 */
const checkWinning = async (req, res) => {
    try {
        const { category_id, lottery_number } = req.body;

        // ── Validation ──────────────────────────────────────────────
        if (!category_id) {
            return sendValidationError(res, [{ field: 'category_id', message: 'Category is required' }]);
        }
        if (!lottery_number || typeof lottery_number !== 'string' || !lottery_number.trim()) {
            return sendValidationError(res, [{ field: 'lottery_number', message: 'Lottery number is required' }]);
        }

        const trimmedNumber = lottery_number.trim();

        // ── Get Category ────────────────────────────────────────────
        const category = await Category.findByPk(category_id);
        if (!category) {
            return sendError(res, 'Category not found', 404);
        }

        // ── Extract time slot ───────────────────────────────────────
        let timeSlotStr = null;

        if (category.time_slots) {
            if (Array.isArray(category.time_slots) && category.time_slots.length > 0) {
                timeSlotStr = category.time_slots[0];
            } else if (typeof category.time_slots === 'string') {
                try {
                    const parsed = JSON.parse(category.time_slots);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        timeSlotStr = parsed[0];
                    } else {
                        timeSlotStr = category.time_slots;
                    }
                } catch (e) {
                    timeSlotStr = category.time_slots;
                }
            }
        }

        if (!timeSlotStr) {
            return sendError(res, 'No time slot configured for this category', 400);
        }

        // ── Calculate Time Window ───────────────────────────────────
        const window = calculateTimeWindow(timeSlotStr);
        if (!window) {
            return sendError(res, `Invalid time slot format: "${timeSlotStr}". Expected format like "3:00 PM" or "15:00"`, 400);
        }

        // ── Extract suffix patterns for matching ────────────────────
        const suffix1 = trimmedNumber.slice(-1);                           // Last 1 digit
        const suffix2 = trimmedNumber.length >= 2 ? trimmedNumber.slice(-2) : null; // Last 2 digits
        const fullNumber = trimmedNumber;                                  // Exact match

        // ── Query ALL sales in the time window for this category ────
        // We fetch all sales (not pre-filtered by desc) because we need
        // to check each individual lottery number in desc against suffix patterns
        const sales = await Sales.findAll({
            where: {
                createdAt: {
                    [Op.gte]: window.start,
                    [Op.lte]: window.end
                }
            },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'product_name', 'product_code', 'price', 'category_id', 'box'],
                    where: {
                        category_id: category_id
                    },
                    required: true,
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'category_name']
                    }]
                },
                {
                    model: User,
                    as: 'createdBy',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // ── Round-based matching (highest round priority) ───────────
        const round3Matches = []; // Exact match (highest priority)
        const round2Matches = []; // Last 2 digits match
        const round1Matches = []; // Last 1 digit match

        for (const sale of sales) {
            if (!sale.desc) continue;

            // Split desc by commas — each is an individual lottery number
            // desc can be: "231, 213, 321, 312, 123, 132" or single "7653"
            const lotteryNumbers = sale.desc.split(',').map(n => n.trim()).filter(n => n.length > 0);

            for (const num of lotteryNumbers) {
                // Determine the HIGHEST round this lottery number matches
                // Check from highest to lowest priority
                let matchedRound = null;

                if (num === fullNumber) {
                    matchedRound = 3; // Exact match — highest priority
                } else if (suffix2 && num.endsWith(suffix2)) {
                    matchedRound = 2; // Last 2 digits match
                } else if (num.endsWith(suffix1)) {
                    matchedRound = 1; // Last 1 digit match
                }

                // Assign to the appropriate round
                if (matchedRound === 3) {
                    round3Matches.push(transformSale(sale, num, 3));
                } else if (matchedRound === 2) {
                    round2Matches.push(transformSale(sale, num, 2));
                } else if (matchedRound === 1) {
                    round1Matches.push(transformSale(sale, num, 1));
                }
            }
        }

        // ── Build summary ───────────────────────────────────────────
        const totalWinners = round3Matches.length + round2Matches.length + round1Matches.length;
        const isWinner = totalWinners > 0;

        // ── Build Response ──────────────────────────────────────────
        return sendSuccess(res, isWinner ? 'Winning numbers found!' : 'No matching sales found', {
            is_winner: isWinner,
            lottery_number: trimmedNumber,
            category_name: category.category_name,
            time_slot: timeSlotStr,
            window: {
                start: window.start.toISOString(),
                end: window.end.toISOString()
            },
            total_sales_checked: sales.length,
            summary: {
                round_3_count: round3Matches.length,
                round_2_count: round2Matches.length,
                round_1_count: round1Matches.length,
                total_winners: totalWinners
            },
            results: {
                round_3: round3Matches,
                round_2: round2Matches,
                round_1: round1Matches
            }
        });

    } catch (error) {
        console.error('Check winning error:', error);
        return sendError(res, 'An error occurred while checking the winning number.');
    }
};

module.exports = {
    checkWinning
};
