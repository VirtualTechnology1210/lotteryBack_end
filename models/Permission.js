const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Permission = sequelize.define('Permission', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        page_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        view: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        add: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        edit: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        del: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: 'permissions',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define associations
    Permission.associate = (models) => {
        Permission.belongsTo(models.Role, {
            foreignKey: 'role_id',
            as: 'role'
        });
        Permission.belongsTo(models.Page, {
            foreignKey: 'page_id',
            as: 'page'
        });
    };

    return Permission;
};
