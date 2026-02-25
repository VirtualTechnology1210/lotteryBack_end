'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add digit_type column: 1, 2, 3, or 4 (number of digits in the lottery number)
        await queryInterface.addColumn('products', 'digit_type', {
            type: Sequelize.TINYINT,
            allowNull: true,
            defaultValue: null,
            after: 'index_type',
        });

        // Add winning_amounts column: JSON object storing prize amounts per digit-match level
        // Example for 4-digit product: { "4": 5000, "3": 500, "2": 50, "1": 5 }
        // Example for 3-digit product: { "3": 500, "2": 50, "1": 5 }
        await queryInterface.addColumn('products', 'winning_amounts', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            after: 'digit_type',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('products', 'winning_amounts');
        await queryInterface.removeColumn('products', 'digit_type');
    }
};
