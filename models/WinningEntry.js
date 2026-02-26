const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WinningEntry = sequelize.define('WinningEntry', {
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
        lottery_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        time_slot: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        window_start: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        window_end: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        total_winners: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        grand_total_winning_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        rounds_data: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('active', 'cancelled'),
            allowNull: false,
            defaultValue: 'active'
        },
        submitted_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
        }
    }, {
        tableName: 'winning_entries',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define associations
    WinningEntry.associate = (models) => {
        // Belongs to Category
        WinningEntry.belongsTo(models.Category, {
            foreignKey: 'category_id',
            as: 'category'
        });

        // Belongs to User (who submitted)
        WinningEntry.belongsTo(models.User, {
            foreignKey: 'submitted_by',
            as: 'submittedBy'
        });
    };

    return WinningEntry;
};
