const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InvoiceSeries = sequelize.define('InvoiceSeries', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        series_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                }
            }
        },
        next_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: {
                    args: [1]
                }
            }
        }
    }, {
        tableName: 'invoice_series',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    /**
     * Generate next invoice number for a given series
     * Uses atomic update to prevent race conditions
     * @param {string} seriesName - Name of the invoice series
     * @param {object} transaction - Optional Sequelize transaction
     * @returns {Promise<string>} - Generated invoice number (e.g., "00001")
     */
    InvoiceSeries.getNextInvoiceNumber = async function (seriesName, transaction = null) {
        const queryOptions = transaction ? { transaction } : {};

        // Atomic increment using MySQL's LAST_INSERT_ID() trick.
        // This sets the session variable to the OLD value of next_number,
        // then increments next_number — all in a single atomic UPDATE.
        // No row-level lock needed, no SELECT before UPDATE.
        const [results] = await sequelize.query(
            `UPDATE invoice_series
             SET next_number = LAST_INSERT_ID(next_number) + 1
             WHERE series_name = :seriesName`,
            {
                replacements: { seriesName },
                ...queryOptions
            }
        );

        // Check if the series exists (affectedRows = 0 means series_name not found)
        if (results.affectedRows === 0) {
            throw new Error(`Invoice series '${seriesName}' not found`);
        }

        // LAST_INSERT_ID() returns the value BEFORE the increment — same as the old code
        const [[row]] = await sequelize.query(
            'SELECT LAST_INSERT_ID() as num',
            queryOptions
        );

        return String(row.num);
    };

    return InvoiceSeries;
};
