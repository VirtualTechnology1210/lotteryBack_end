const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Page = sequelize.define('Page', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        page: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Page name is required'
                }
            }
        }
    }, {
        tableName: 'pages',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    // Define association
    Page.associate = (models) => {
        Page.hasMany(models.Permission, {
            foreignKey: 'page_id',
            as: 'permissions'
        });
    };

    return Page;
};
