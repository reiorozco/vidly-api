/**
 * Jest Global Setup for MongoDB In-Memory Server
 *
 * This file runs once before all test suites.
 * It starts an in-memory MongoDB instance that all tests will use.
 *
 * Benefits:
 * - Tests run without external MongoDB dependency
 * - Faster than connecting to MongoDB Atlas
 * - Each test suite gets a clean database
 * - Works offline and in CI/CD environments
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  // Start MongoDB in-memory server
  mongoServer = await MongoMemoryServer.create();

  // Get connection URI
  const mongoUri = mongoServer.getUri();

  // Store URI in process.env (not global) so it's available to Jest workers
  // Jest workers are child processes, and global vars don't transfer, but env vars do
  process.env.MONGO_URI = mongoUri;
  global.__MONGO_SERVER__ = mongoServer;

  console.log('\n🚀 MongoDB In-Memory Server started');
  console.log(`📍 URI: ${mongoUri}\n`);
};
