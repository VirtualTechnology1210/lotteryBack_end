'use strict';

/**
 * Add compound indexes to the sales table for performance.
 *
 * These are ADDITIVE — they only speed up existing queries, they do NOT
 * change any query results or business logic.
 *
 * Why these indexes:
 *   - (product_id, createdAt): Used by the winning check endpoint which
 *     filters sales by category (via product_id JOIN) within a time window.
 *   - (user_id, createdAt): Used by reports filtered by user + date range.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Compound index for winning check queries: JOIN products + WHERE createdAt BETWEEN
        await queryInterface.addIndex('sales', ['product_id', 'createdAt'], {
            name: 'idx_sales_product_created'
        });

        // Compound index for user-specific date-range reports
        await queryInterface.addIndex('sales', ['user_id', 'createdAt'], {
            name: 'idx_sales_user_created'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('sales', 'idx_sales_product_created');
        await queryInterface.removeIndex('sales', 'idx_sales_user_created');
    }
};
