'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add role_id column to users table
        await queryInterface.addColumn('users', 'role_id', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 2, // Default to 'user' role
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        });

        // Update existing admin user to have admin role
        await queryInterface.sequelize.query(
            `UPDATE users SET role_id = 1 WHERE email = 'admin@lottery.com'`
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'role_id');
    }
};
