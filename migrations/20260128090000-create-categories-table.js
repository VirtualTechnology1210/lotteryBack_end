'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('categories', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            category_name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            category_image: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            time_slots: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: [],
                comment: 'Array of time slots like ["09:00", "12:00", "18:00"]'
            },
            status: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 1 // 1 = active, 0 = inactive
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('categories');
    }
};
