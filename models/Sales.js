const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Sales = sequelize.define('Sales', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
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
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'User who made this sale'
        }
    }, {
        tableName: 'sales',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define associations
    Sales.associate = (models) => {
        // Belongs to Product
        Sales.belongsTo(models.Product, {
            foreignKey: 'product_id',
            as: 'product'
        });

        // Belongs to User (who made the sale)
        Sales.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'createdBy'
        });
    };

    return Sales;
};
