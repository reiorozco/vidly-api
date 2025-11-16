/**
 * Request Logger Middleware
 *
 * Logs all HTTP requests with structured information including:
 * - Correlation ID for tracing
 * - HTTP method and path
 * - Response status code
 * - Duration in milliseconds
 * - Client IP and user agent
 *
 * Logs are written using Winston in JSON format for easy parsing.
 *
 * Usage:
 *   app.use(requestLogger);
 */

const logger = require("winston");

function requestLogger(req, res, next) {
  const start = Date.now();

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP Request", {
      correlationId: req.id,
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      timestamp: new Date().toISOString(),
    });
  });

  next();
}

module.exports = requestLogger;
