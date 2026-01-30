const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        category_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Category name is required'
                }
            }
        },
        category_image: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        time_slots: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        tableName: 'categories',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define association
    Category.associate = (models) => {
        // Category can have many products
        Category.hasMany(models.Product, {
            foreignKey: 'category_id',
            as: 'products'
        });
    };

    return Category;
};
