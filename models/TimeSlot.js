const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TimeSlot = sequelize.define('TimeSlot', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        slot_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Slot date is required'
                },
                isDate: {
                    msg: 'Please provide a valid date'
                }
            }
        },
        slot_time: {
            type: DataTypes.TIME,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Slot time is required'
                }
            }
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        tableName: 'time_slots',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define association
    TimeSlot.associate = (models) => {
        TimeSlot.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });
    };

    return TimeSlot;
};
