'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('permissions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            role_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                references: {
                    model: 'roles',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            page_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                references: {
                    model: 'pages',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            view: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0
            },
            add: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0
            },
            edit: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0
            },
            del: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0
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

        // Add unique constraint for role_id and page_id combination
        await queryInterface.addIndex('permissions', ['role_id', 'page_id'], {
            unique: true,
            name: 'permissions_role_page_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('permissions');
    }
};
