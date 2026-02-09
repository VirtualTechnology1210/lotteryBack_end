'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add invoice_number column WITHOUT unique constraint
        // Multiple sales can share the same invoice number (batch sales)
        await queryInterface.addColumn('sales', 'invoice_number', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'id'
        });

        // Add index for faster lookups (not unique)
        await queryInterface.addIndex('sales', ['invoice_number'], {
            name: 'idx_sales_invoice_number'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('sales', 'idx_sales_invoice_number');
        await queryInterface.removeColumn('sales', 'invoice_number');
    }
};
