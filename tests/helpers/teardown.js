/**
 * Test Teardown Helper
 *
 * Ensures all connections and resources are properly closed after tests
 * to prevent Jest from hanging with "Worker failed to exit gracefully" errors.
 *
 * Usage in test files:
 * const { closeServer } = require('../helpers/teardown');
 *
 * afterEach(async () => {
 *   await closeServer(server);
 * });
 */

const mongoose = require('mongoose');
const logger = require('winston');

/**
 * Closes server gracefully
 * @param {Object} server - Express server instance
 */
async function closeServer(server) {
  // Close Express server
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }

  // Note: We DON'T disconnect Mongoose between tests because:
  // 1. Mongoose connection is shared across all tests (singleton)
  // 2. Disconnecting/reconnecting between tests causes race conditions
  // 3. MongoDB In-Memory Server stays running for all tests
  // 4. Mongoose will be disconnected in Jest globalTeardown (tests/teardown.js)
  //
  // We also DON'T close Winston transports because:
  // 1. In test env, we only use Console transport with silent: true (no file handles)
  // 2. Winston is a singleton shared across tests
  // 3. File transports are disabled in test environment (see startup/logging.js)
}

module.exports = { closeServer };
