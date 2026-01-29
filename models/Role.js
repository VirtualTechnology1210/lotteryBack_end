const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        role: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Role name is required'
                }
            }
        }
    }, {
        tableName: 'roles',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define association
    Role.associate = (models) => {
        Role.hasMany(models.User, {
            foreignKey: 'role_id',
            as: 'users'
        });
        Role.hasMany(models.Permission, {
            foreignKey: 'role_id',
            as: 'permissions'
        });
    };

    return Role;
};

