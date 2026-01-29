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
        Category.hasMany(models.TimeSlot, {
            foreignKey: 'category_id',
            as: 'timeSlots'
        });
    };

    return Category;
};
