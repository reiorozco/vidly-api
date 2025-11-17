const mongoose = require("mongoose");
const logger = require("winston");
const config = require("../config/config");

module.exports = function () {
  // Mongoose 8: Maintain Mongoose 6 behavior for strictQuery
  // This ensures unknown fields in queries are filtered out
  mongoose.set('strictQuery', true);

  const db = config.DB;

  // Connection options for Mongoose 8 with Node.js 22+
  // Prevents deprecation warnings for SSL/TLS
  const options = {
    // Use TLS instead of deprecated SSL
    tls: true,
    // Disable deprecated URL parser warnings
    // These are defaults in Mongoose 8 but explicit for clarity
  };

  mongoose.connect(db, options)
    .then(() => logger.info(`Connected to MongoDB (Mongoose ${mongoose.version})`))
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
      process.exit(1);
    });
};
