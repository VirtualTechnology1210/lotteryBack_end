const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Name is required'
                },
                len: {
                    args: [2, 100],
                    msg: 'Name must be between 2 and 100 characters'
                }
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: {
                msg: 'Email already exists'
            },
            validate: {
                isEmail: {
                    msg: 'Please provide a valid email address'
                },
                notEmpty: {
                    msg: 'Email is required'
                }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Password is required'
                },
                len: {
                    args: [6, 255],
                    msg: 'Password must be at least 6 characters'
                }
            }
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2, // Default to 'user' role
            references: {
                model: 'roles',
                key: 'id'
            }
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define association
    User.associate = (models) => {
        User.belongsTo(models.Role, {
            foreignKey: 'role_id',
            as: 'role'
        });
    };

    return User;
};

