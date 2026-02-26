const path = require("path");
const envFile = `.env.${process.env.NODE_ENV || "development"}`;

require("dotenv").config({ path: path.resolve(__dirname, "..", envFile), quiet: true });

const commonConfig = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lottery",
  host: process.env.DB_HOST || "localhost",
  dialect: process.env.DB_DIALECT || "mysql",
  timezone: "+05:30", // IST - ensures Sequelize writes/reads dates in IST
  dialectOptions: {
    timezone: "+05:30", // Tells MySQL driver to use IST
  },
  pool: {
    max: 25,          // Handle up to 25 concurrent DB connections for peak traffic
    min: 5,           // Keep 5 warm connections ready to avoid cold-start latency
    acquire: 30000,   // 30s to acquire — fail fast is better than hanging
    idle: 10000,
    evict: 1000,      // Check for idle connections every 1s to reclaim resources
  },
  logging: false,
};

module.exports = {
  development: {
    ...commonConfig,
    logging: console.log, // Enable logging in development
  },
  test: {
    ...commonConfig,
  },
  production: {
    ...commonConfig,
  },
};
