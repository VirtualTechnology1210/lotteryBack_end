const { Sequelize } = require("sequelize");
const path = require("path");
const envFile = `.env.${process.env.NODE_ENV || "development"}`;

require("dotenv").config({ path: path.resolve(__dirname, "..", envFile), quiet: true });

const config = require("../config/config.js")[process.env.NODE_ENV || "development"];

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

// Set up associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Export models and sequelize instance
module.exports = db;

