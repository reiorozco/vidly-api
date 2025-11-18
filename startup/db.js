const mongoose = require("mongoose");
const logger = require("winston");
const config = require("../config/config");

module.exports = function () {
  // Mongoose 8: Maintain Mongoose 6 behavior for strictQuery
  // This ensures unknown fields in queries are filtered out
  mongoose.set('strictQuery', true);

  // Use MongoDB In-Memory Server URI in test environment if available
  // This is set by Jest global setup (tests/setup.js)
  const db = global.__MONGO_URI__ || config.DB;

  // Connect to MongoDB
  // NOTE: For Node.js 20+, ensure connection string includes &tls=true
  // to prevent DEP0170 deprecation warnings (not &ssl=true)
  mongoose.connect(db)
    .then(() => {
      const dbType = global.__MONGO_URI__ ? 'MongoDB In-Memory' : 'MongoDB';
      logger.info(`Connected to ${dbType} (Mongoose ${mongoose.version})`);
    })
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
      // Don't exit in test environment to allow Jest to handle the error
      if (config.NODE_ENV !== 'test') {
        process.exit(1);
      }
    });
};
