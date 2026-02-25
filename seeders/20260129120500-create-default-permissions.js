'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Admin Role ID is 1
        const adminRoleId = 1;

        // Define default permissions for Admin (Full Access to everything)
        // Pages: Dashboard(1), Categories(2), Products(3), Sales(4), Reports(5), Rate Summary(6), Users(7), Roles & Permissions(8), Winning(9)
        const pages = [
            { id: 1, name: 'Dashboard' },
            { id: 2, name: 'Categories' },
            { id: 3, name: 'Products' },
            { id: 4, name: 'Sales' },
            { id: 5, name: 'Reports' },
            { id: 6, name: 'Rate Summary' },
            { id: 7, name: 'Users' },
            { id: 8, name: 'Roles & Permissions' },
            { id: 9, name: 'Winning' }
        ];

        const permissions = pages.map(page => ({
            role_id: adminRoleId,
            page_id: page.id,
            view: 1,
            add: 1,
            edit: 1,
            del: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await queryInterface.bulkInsert('permissions', permissions, {});
    },

    async down(queryInterface, Sequelize) {
        // Only delete admin permissions (role_id = 1) if rolling back
        await queryInterface.bulkDelete('permissions', { role_id: 1 }, {});
    }
};
