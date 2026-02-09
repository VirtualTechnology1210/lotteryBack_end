'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('invoice_series', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            series_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
                comment: 'Name of the invoice series (e.g., sales, purchase)'
            },
            next_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: 'Next invoice number to be assigned'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Seed default sales invoice series
        await queryInterface.bulkInsert('invoice_series', [{
            series_name: 'sales',
            next_number: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('invoice_series');
    }
};
