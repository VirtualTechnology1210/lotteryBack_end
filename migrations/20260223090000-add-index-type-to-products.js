'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('products', 'index_type', {
            type: Sequelize.STRING(5),
            allowNull: true,
            defaultValue: null,
            after: 'box',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('products', 'index_type');
    }
};
