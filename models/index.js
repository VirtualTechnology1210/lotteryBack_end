const { Sequelize } = require("sequelize");
const path = require("path");

// Determine environment
const env = process.env.NODE_ENV || "development";
const envFile = `.env.${env}`;

// Load environment variables first
require("dotenv").config({ path: path.resolve(__dirname, "..", envFile) });

// Then load config
const allConfig = require("../config/config.js");
const config = allConfig[env] || allConfig.development;

if (!config) {
    throw new Error(`No config found for environment: ${env}`);
}

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        dialect: config.dialect,
        pool: config.pool,
        logging: config.logging,
    }
);

// Initialize models object
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import and initialize models
db.User = require('./User')(sequelize);
db.Role = require('./Role')(sequelize);
db.Page = require('./Page')(sequelize);
db.Permission = require('./Permission')(sequelize);
db.Category = require('./Category')(sequelize);
db.Product = require('./Product')(sequelize);
db.Sales = require('./Sales')(sequelize);
db.InvoiceSeries = require('./InvoiceSeries')(sequelize);
db.WinningEntry = require('./WinningEntry')(sequelize);

// Set up associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Export models and sequelize instance
module.exports = db;

