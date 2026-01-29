'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Hash the admin password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await queryInterface.bulkInsert('users', [{
            name: 'Admin',
            email: 'admin@lottery.com',
            password: hashedPassword,
            role_id: 1, // Explicitly assign Admin role
            createdAt: new Date(),
            updatedAt: new Date()
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', { email: 'admin@lottery.com' }, {});
    }
};
