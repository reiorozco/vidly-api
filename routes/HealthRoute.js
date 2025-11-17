/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring service health and readiness.
 * Used by load balancers, orchestrators, and monitoring tools.
 *
 * - /health: Basic health check (always returns 200 if server is running)
 * - /ready: Readiness check (verifies all dependencies are ready)
 */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const config = require("../config/config");

/**
 * GET /health
 *
 * Basic health check endpoint.
 * Returns 200 if the server is running and can handle requests.
 * Does NOT check external dependencies (use /ready for that).
 *
 * Use case: Load balancer health checks, uptime monitoring
 */
router.get("/health", (req, res) => {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: require("../package.json").version,
    node: process.version,
  };

  res.status(200).json(healthData);
});

/**
 * GET /ready
 *
 * Readiness check endpoint.
 * Returns 200 only if server AND all dependencies are ready.
 * Checks: MongoDB connection
 *
 * Use case: Kubernetes readiness probes, deployment verification
 */
router.get("/ready", async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const isMongoReady = mongoState === 1; // 1 = connected

    if (!isMongoReady) {
      return res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        checks: {
          mongodb: {
            status: "unhealthy",
            state: getMongoStateDescription(mongoState),
            message: "MongoDB is not connected",
          },
        },
      });
    }

    // Ping MongoDB to verify it's responsive
    await mongoose.connection.db.admin().ping();

    // All checks passed
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: {
          status: "healthy",
          state: "connected",
          responseTime: "OK",
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      checks: {
        mongodb: {
          status: "unhealthy",
          error: error.message,
        },
      },
    });
  }
});

/**
 * Helper function to get human-readable MongoDB connection state
 */
function getMongoStateDescription(state) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[state] || "unknown";
}

module.exports = router;
