'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const pages = [
            'Dashboard',
            'Categories',
            'Products',
            'Sales',
            'Reports',
            'Rate Summary',
            'Users',
            'Roles & Permissions',
            'Winning'
        ];

        // Format data for bulk insert with timestamps
        const pageData = pages.map(page => ({
            page,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await queryInterface.bulkInsert('pages', pageData, {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('pages', null, {});
    }
};
