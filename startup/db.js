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
  // - serverSelectionTimeoutMS: evita que la conexión se cuelgue en serverless
  //   (Vercel mata la función a ~10s) y deja aflorar el error real en los logs.
  // - family: 4 fuerza IPv4: Node 18+ resuelve DNS-SRV de Atlas por IPv6 y se
  //   cuelga en entornos serverless; forzar IPv4 evita ese hang.
  console.log('[db] conectando a MongoDB...');
  mongoose.connect(db, { serverSelectionTimeoutMS: 8000, family: 4 })
    .then(() => {
      const dbType = process.env.MONGO_URI ? 'MongoDB In-Memory' : 'MongoDB';
      logger.info(`Connected to ${dbType} (Mongoose ${mongoose.version})`);
    })
    .catch((err) => {
      // console.error guarantees the message reaches Vercel's runtime logs
      console.error('MongoDB connection error:', err && err.message ? err.message : err);
      logger.error('MongoDB connection error:', err);
      // In serverless, don't kill the container; let the request fail and retry.
      if (config.NODE_ENV !== 'test' && !process.env.VERCEL) {
        process.exit(1);
      }
    });
};
