const express = require("express");
const app = express();
const path = require("path");
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

const cors = require("cors");
const { sequelize } = require("./models/index.js");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "", envFile), quiet: true });

// Import routes
const routes = require("./routes");

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  })
);

// Serve static files for uploads (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lottery Backend API",
    version: "1.0.0"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || "5000";
const server = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync database (in development only)
    // if (process.env.NODE_ENV === "development") {
    //   await sequelize.sync({ alter: false });
    //   console.log("Database synced.");
    // }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 👍`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1); // Exit the process with failure code
  }
};

server();
