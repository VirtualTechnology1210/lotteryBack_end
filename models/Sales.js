const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Sales = sequelize.define('Sales', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Product name is required'
                }
            }
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: {
                    args: [1],
                    msg: 'Quantity must be at least 1'
                }
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'Price must be a positive value'
                }
            }
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'User who created this sale entry (created by admin)'
        }
    }, {
        tableName: 'sales',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define associations
    Sales.associate = (models) => {
        // Belongs to Category
        Sales.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });

        // Belongs to User (who created the sale)
        Sales.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'createdBy'
        });
    };

    return Sales;
};
