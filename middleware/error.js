/**
 * Global Error Handler Middleware
 *
 * Handles all errors thrown in the application.
 * Distinguishes between operational errors (expected) and programming errors (bugs).
 * Logs all errors with correlation ID for tracing.
 * Returns appropriate HTTP status codes and error messages.
 */

const logger = require("winston");
const config = require("../config/config");

module.exports = function (err, req, res, _next) {
  const correlationId = req.id || "unknown";

  // Operational error (expected) - safe to show to client
  if (err.isOperational) {
    logger.warn("Operational error", {
      correlationId,
      errorCode: err.errorCode,
      message: err.message,
      statusCode: err.statusCode,
      ...(err.details && { details: err.details }),
      ...(err.resource && { resource: err.resource }),
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details && { details: err.details }),
        correlationId,
      },
    });
  }

  // Programming error (unexpected) - log full details
  logger.error("Unexpected error", {
    correlationId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // In production, don't expose internal error details to client
  const message =
    config.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message;

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
      correlationId,
      ...(config.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};
