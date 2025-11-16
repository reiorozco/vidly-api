const mongoose = require("mongoose");
const logger = require("winston");
const config = require("../config/config");

module.exports = function () {
  // Mongoose 8: Maintain Mongoose 6 behavior for strictQuery
  // This ensures unknown fields in queries are filtered out
  mongoose.set('strictQuery', true);

  const db = config.DB;

  mongoose.connect(db)
    .then(() => logger.info(`Connected to MongoDB (Mongoose ${mongoose.version})`))
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
      process.exit(1);
    });
};
