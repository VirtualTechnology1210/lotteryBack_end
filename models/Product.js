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
        },
        product_code: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1
        },
        box: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        index_type: {
            type: DataTypes.STRING(5),
            allowNull: true,
            defaultValue: null,
        },
        digit_type: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: null,
        },
        winning_amounts: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
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
