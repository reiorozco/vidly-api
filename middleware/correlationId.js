/**
 * Correlation ID Middleware
 *
 * Adds a unique correlation ID to each request for tracing and debugging.
 * The ID can be provided by the client via x-correlation-id header,
 * or generated automatically using UUID v4.
 *
 * Usage:
 *   app.use(correlationId);
 *
 * Access in routes:
 *   req.id - the correlation ID
 *
 * Response headers:
 *   X-Correlation-ID - echoed back to client
 */

const crypto = require("crypto");

function correlationId(req, res, next) {
  // Use client-provided ID or generate new one (Node 18+ built-in)
  req.id = req.headers["x-correlation-id"] || crypto.randomUUID();

  // Echo back in response headers for client-side tracing
  res.setHeader("X-Correlation-ID", req.id);

  next();
}

module.exports = correlationId;
