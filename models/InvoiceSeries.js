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
        const options = transaction ? { transaction, lock: true } : {};

        // Find the series with lock to prevent concurrent updates
        const series = await this.findOne({
            where: { series_name: seriesName },
            ...options
        });

        if (!series) {
            throw new Error(`Invoice series '${seriesName}' not found`);
        }

        const currentNumber = series.next_number;
        const invoiceNumber = String(currentNumber);

        // Increment the next_number
        await series.update(
            { next_number: currentNumber + 1 },
            options
        );

        return invoiceNumber;
    };

    return InvoiceSeries;
};
