const mongoose = require("mongoose");
const logger = require("winston");
const config = require("../config/config");

module.exports = function () {
  // Mongoose 8: Maintain Mongoose 6 behavior for strictQuery
  // This ensures unknown fields in queries are filtered out
  mongoose.set('strictQuery', true);

  // Use MongoDB In-Memory Server URI in test environment if available
  // This is set by Jest global setup (tests/setup.js) in process.env.MONGO_URI
  // We use process.env instead of global because Jest workers don't inherit global vars
  const db = process.env.MONGO_URI || config.DB;

  // Connect to MongoDB
  // NOTE: For Node.js 20+, ensure connection string includes &tls=true
  // to prevent DEP0170 deprecation warnings (not &ssl=true)
  mongoose.connect(db)
    .then(() => {
      const dbType = process.env.MONGO_URI ? 'MongoDB In-Memory' : 'MongoDB';
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
