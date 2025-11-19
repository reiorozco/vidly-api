/**
 * Jest Global Teardown for MongoDB In-Memory Server
 *
 * This file runs once after all test suites complete.
 * It stops the in-memory MongoDB instance and cleans up resources.
 */

const mongoose = require('mongoose');

module.exports = async () => {
  // Disconnect Mongoose before stopping MongoDB In-Memory Server
  // This prevents "connection closed" errors
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('\n🔌 Mongoose disconnected');
  }

  // Stop MongoDB in-memory server
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
    console.log('🛑 MongoDB In-Memory Server stopped\n');
  }
};
