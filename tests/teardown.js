/**
 * Jest Global Teardown for MongoDB In-Memory Server
 *
 * This file runs once after all test suites complete.
 * It stops the in-memory MongoDB instance and cleans up resources.
 */

module.exports = async () => {
  // Stop MongoDB in-memory server
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
    console.log('\n🛑 MongoDB In-Memory Server stopped\n');
  }
};
