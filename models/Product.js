const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        product_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Product name is required'
                }
            }
        },
        product_code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: {
                msg: 'Product code already exists'
            },
            validate: {
                notEmpty: {
                    msg: 'Product code is required'
                }
            }
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
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
            comment: 'User who created this product (admin or authorized user)'
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        tableName: 'products',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define associations
    Product.associate = (models) => {
        // Belongs to Category
        Product.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });

        // Belongs to User (who created the product)
        Product.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'createdBy'
        });

        // Has many Sales
        Product.hasMany(models.Sales, {
            foreignKey: 'product_id',
            as: 'sales'
        });
    };

    return Product;
};
