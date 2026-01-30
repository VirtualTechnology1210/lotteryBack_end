'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Admin Role ID is 1
        const adminRoleId = 1;

        // Define default permissions for Admin (Full Access to everything)
        // Pages: Users(1), Permissions(2), Categories(3), Products(4), Sales(5), Reports(6)
        const pages = [
            { id: 1, name: 'Users' },
            { id: 2, name: 'Permissions' },
            { id: 3, name: 'Categories' },
            { id: 4, name: 'Products' },
            { id: 5, name: 'Sales' },
            { id: 6, name: 'Reports' }
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
