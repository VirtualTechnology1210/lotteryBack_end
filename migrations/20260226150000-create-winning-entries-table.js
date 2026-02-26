'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('winning_entries', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            category_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            lottery_number: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            time_slot: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            window_start: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            window_end: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            total_winners: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            grand_total_winning_amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0,
            },
            rounds_data: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('active', 'cancelled'),
                allowNull: false,
                defaultValue: 'active',
            },
            submitted_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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

        // Unique constraint: only one active winning entry per category per window
        // This prevents accidental duplicate submissions for the same draw
        await queryInterface.addIndex('winning_entries', ['category_id', 'window_start', 'window_end', 'status'], {
            unique: false  // Not unique because cancelled + active can coexist
        });

        // Index for quick lookups by date range (for summary reports)
        await queryInterface.addIndex('winning_entries', ['createdAt', 'status'], {
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('winning_entries');
    }
};
