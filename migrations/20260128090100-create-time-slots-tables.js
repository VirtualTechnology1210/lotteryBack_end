'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('time_slots', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            slot_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            slot_time: {
                type: Sequelize.TIME,
                allowNull: false  // NOT NULL - required for proper business logic
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

        // Index for faster lookups by category
        await queryInterface.addIndex('time_slots', ['category_id']);

        // Index for faster lookups by date
        await queryInterface.addIndex('time_slots', ['slot_date']);

        // UNIQUE constraint: prevent duplicate slots for same category/date/time
        await queryInterface.addIndex('time_slots', ['category_id', 'slot_date', 'slot_time'], {
            unique: true,
            name: 'unique_category_slot'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('time_slots');
    }
};
