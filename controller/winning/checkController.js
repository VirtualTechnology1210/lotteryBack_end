/**
 * Winning Check Controller
 * Handles lottery winning number verification against sales data
 * Uses time-slot-based 24-hour rolling window filtering
 * 
 * MATCHING LOGIC (Right-to-left suffix, highest round priority):
 *   Round 4: Exact match with entered number (highest priority)
 *   Round 3: Last 3 digits match
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
 * Calculate the 24-hour time window based on a time slot.
 * 
 * The window is always:
 *   - Start: yesterday at [time_slot] (inclusive, >=)
 *   - End:   today at [time_slot]     (exclusive, <)
 * 
 * Example (time slot = 4:30 PM, today = Feb 12, 2026):
 *   Window: Feb 11, 2026 4:30 PM (>=) to Feb 12, 2026 4:30 PM (<)
 */
const calculateTimeWindow = (timeSlotStr) => {
    const parsed = parseTimeSlot(timeSlotStr);
    if (!parsed) return null;

    const now = new Date();

    // End = today at [time_slot]
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parsed.hours, parsed.minutes, 0, 0);

    // Start = yesterday at [time_slot] (exactly 24 hours before end)
    const windowStart = new Date(windowEnd);
    windowStart.setDate(windowStart.getDate() - 1);

    console.log(`[Winning] Time slot: ${timeSlotStr}, Now: ${now.toLocaleString()}`);
    console.log(`[Winning] Window Start: ${windowStart.toLocaleString()}`);
    console.log(`[Winning] Window End:   ${windowEnd.toLocaleString()} (exclusive)`);

    return {
        start: windowStart,
        end: windowEnd
    };
};

/**
 * Transform a sale record for response
 * @param {Object} sale - The sale record
 * @param {string} lotteryNumber - The matched lottery number from desc
 * @param {number} matchRound - The digit count that matched (0 = index match)
 * @param {number} matchQty - How many times THIS specific number matched (usually 1)
 */
const transformSale = (sale, lotteryNumber, matchRound, matchQty = 1) => {
    const product = sale.product;
    let winningAmount = 0;

    if (product && product.digit_type && product.winning_amounts) {
        let wa = product.winning_amounts;
        // Parse if stringified
        while (typeof wa === 'string') {
            try { wa = JSON.parse(wa); } catch (e) { wa = null; break; }
        }

        if (wa) {
            const indexType = product.index_type || null;
            const isIndexBased = indexType && indexType.length >= 1;

            if (matchRound === 0 && isIndexBased) {
                // Index match: prize stored at key = digit_type
                winningAmount = parseFloat(wa[String(product.digit_type)]) || 0;
            } else if (matchRound > 0) {
                // Regular suffix match: prize at key = matchRound (the digit count that matched)
                winningAmount = parseFloat(wa[String(matchRound)]) || 0;
            }
        }
    }

    // Use matchQty (per individual number) NOT sale.qty for winning calculation.
    // For box products, desc contains comma-separated numbers and sale.qty = total count,
    // but each individual number match should only win once (matchQty = 1).
    // For non-box single-number entries, matchQty equals the actual qty purchased for that number.
    return {
        id: sale.id,
        invoice_number: sale.invoice_number || 'N/A',
        product_name: product?.product_name || '-',
        product_code: product?.product_code || '-',
        desc: sale.desc,
        lottery_number: lotteryNumber,
        qty: matchQty,
        price: parseFloat(sale.price),
        total: parseFloat(sale.price) * matchQty,
        box: product?.box || 0,
        index_type: product?.index_type || null,
        sold_by: sale.createdBy?.name || '-',
        sold_at: sale.createdAt,
        match_round: matchRound,
        winning_amount: winningAmount,
        total_winning_amount: winningAmount * matchQty
    };
};

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

        // ── Build dynamic suffix patterns based on input length ────
        // For input "4325" (length 4): suffixes = ["4325", "325", "25", "5"]
        // For input "325"  (length 3): suffixes = ["325", "25", "5"]
        // For input "25"   (length 2): suffixes = ["25", "5"]
        const inputLength = trimmedNumber.length;
        const suffixes = []; // Index 0 = full input (highest priority), last = 1 digit
        for (let i = inputLength; i >= 1; i--) {
            suffixes.push(trimmedNumber.slice(-i));
        }

        // ── Query ALL sales in the time window for this category ────
        // We fetch all sales (not pre-filtered by desc) because we need
        // to check each individual lottery number in desc against suffix patterns
        // Fetch sales where:
        //   createdAt >= windowStart (inclusive)
        //   createdAt <  windowEnd  (exclusive — sales exactly at end boundary are excluded)
        //   product belongs to the selected category
        const sales = await Sales.findAll({
            where: {
                createdAt: {
                    [Op.gte]: window.start,
                    [Op.lt]: window.end
                }
            },
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'product_name', 'product_code', 'price', 'category_id', 'box', 'index_type', 'digit_type', 'winning_amounts'],
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

        // ── INDEX MATCHING SETUP ────────────────────────────────────
        // For a winning number like "9786", last 3 digits = "786"
        //   A = 3rd from last (7), B = 2nd from last (8), C = last (6)
        //   AB = "78", BC = "86", AC = "76"
        const last3 = trimmedNumber.length >= 3 ? trimmedNumber.slice(-3) : trimmedNumber;
        const indexDigits = {};
        if (last3.length >= 1) indexDigits['C'] = last3.slice(-1);          // last digit
        if (last3.length >= 2) indexDigits['B'] = last3.slice(-2, -1);      // 2nd from last
        if (last3.length >= 3) indexDigits['A'] = last3.slice(-3, -2);      // 3rd from last

        // Combo indices — concatenate the respective digits
        if (indexDigits['A'] && indexDigits['B']) indexDigits['AB'] = indexDigits['A'] + indexDigits['B'];
        if (indexDigits['B'] && indexDigits['C']) indexDigits['BC'] = indexDigits['B'] + indexDigits['C'];
        if (indexDigits['A'] && indexDigits['C']) indexDigits['AC'] = indexDigits['A'] + indexDigits['C'];

        console.log('[Winning] Index digits extracted:', indexDigits);

        // ── Dynamic round-based matching (highest round priority) ───
        // Create a bucket for each digit level: index 0 = inputLength digits (exact), index 1 = inputLength-1, etc.
        const roundBuckets = suffixes.map(() => []);

        // Additional bucket for index-type matches
        const indexBucket = [];

        for (const sale of sales) {
            if (!sale.desc) continue;

            const productIndexType = sale.product?.index_type || null;

            // Split desc by commas — each is an individual lottery number
            // desc can be: "231, 213, 321, 312, 123, 132" or single "7653"
            const lotteryNumbers = sale.desc.split(',').map(n => n.trim()).filter(n => n.length > 0);

            // Determine per-match qty:
            // - If desc has multiple comma-separated numbers (box permutations), each match = 1 unit
            // - If desc is a single number, the entire sale.qty applies to that one number
            const isMultiNumber = lotteryNumbers.length > 1;
            const perMatchQty = isMultiNumber ? 1 : (sale.qty || 1);

            for (const num of lotteryNumbers) {

                // ── INDEX-TYPE PRODUCT MATCHING ──────────────────────
                // If the product has an index_type (A, B, C, AB, BC, AC), 
                // compare the sale number directly with the extracted digit(s)
                if (productIndexType) {
                    const upperIdx = productIndexType.toUpperCase();
                    const expectedValue = indexDigits[upperIdx];

                    if (expectedValue && num === expectedValue) {
                        // Index match! Add to index bucket
                        indexBucket.push(transformSale(sale, num, 0, perMatchQty)); // matchRound=0 signals index match
                    }
                    // Index products are NEVER checked for regular suffix matching
                    continue;
                }

                // ── REGULAR SUFFIX MATCHING ─────────────────────────
                // Check from highest digit count to lowest (right-to-left suffix matching)
                // Each number can only match once at its HIGHEST matching level
                let matched = false;
                for (let i = 0; i < suffixes.length; i++) {
                    if (num.endsWith(suffixes[i])) {
                        const digitCount = inputLength - i; // e.g. for i=0, digitCount = inputLength (exact)
                        roundBuckets[i].push(transformSale(sale, num, digitCount, perMatchQty));
                        matched = true;
                        break; // Assigned to highest round, skip lower rounds
                    }
                }
            }
        }

        // ── Build dynamic rounds array for response ─────────────────
        const rounds = [];
        let totalWinners = 0;
        let grandTotalWinningAmount = 0;

        for (let i = 0; i < suffixes.length; i++) {
            const digitCount = inputLength - i;
            const isExact = (i === 0);
            const label = isExact
                ? `Exact Match (${digitCount}-digit)`
                : (digitCount === 1 ? 'Last Digit' : `Last ${digitCount} Digits`);

            const roundWinningAmount = roundBuckets[i].reduce((sum, m) => sum + (m.total_winning_amount || 0), 0);

            rounds.push({
                digit_count: digitCount,
                label: label,
                suffix: suffixes[i],
                count: roundBuckets[i].length,
                matches: roundBuckets[i],
                total_winning_amount: roundWinningAmount
            });
            totalWinners += roundBuckets[i].length;
            grandTotalWinningAmount += roundWinningAmount;
        }

        // ── Add Index Match round if any index matches exist ─────────
        if (indexBucket.length > 0) {
            const indexWinningAmount = indexBucket.reduce((sum, m) => sum + (m.total_winning_amount || 0), 0);
            rounds.push({
                digit_count: 0,  // 0 signals "index match" in the frontend
                label: 'Index Match',
                suffix: 'IDX',
                count: indexBucket.length,
                matches: indexBucket,
                total_winning_amount: indexWinningAmount
            });
            totalWinners += indexBucket.length;
            grandTotalWinningAmount += indexWinningAmount;
        }

        const isWinner = totalWinners > 0;

        // ── Format window dates for frontend display ────────────────
        const formatForDisplay = (date) => {
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };

        // ── Build Response ──────────────────────────────────────────
        return sendSuccess(res, isWinner ? 'Winning numbers found!' : 'No matching sales found', {
            is_winner: isWinner,
            lottery_number: trimmedNumber,
            input_length: inputLength,
            index_digits: indexDigits,
            category_name: category.category_name,
            time_slot: timeSlotStr,
            window: {
                start: window.start.toISOString(),
                end: window.end.toISOString(),
                start_display: formatForDisplay(window.start),
                end_display: formatForDisplay(window.end)
            },
            total_sales_checked: sales.length,
            total_winners: totalWinners,
            grand_total_winning_amount: grandTotalWinningAmount,
            rounds: rounds
        });

    } catch (error) {
        console.error('Check winning error:', error);
        return sendError(res, 'An error occurred while checking the winning number.');
    }
};

module.exports = {
    checkWinning
};
