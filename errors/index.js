/**
 * Custom Error Classes
 *
 * Provides specific error types for common scenarios.
 * All errors extend AppError and are operational errors.
 */

const AppError = require("./AppError");

/**
 * ValidationError - 400 Bad Request
 * Used when input validation fails
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details; // Optional Joi validation details
  }
}

/**
 * NotFoundError - 404 Not Found
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.resource = resource;
  }
}

/**
 * UnauthorizedError - 401 Unauthorized
 * Used when authentication is required but not provided/invalid
 */
class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized - Please provide valid credentials") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * ForbiddenError - 403 Forbidden
 * Used when user is authenticated but doesn't have permission
 */
class ForbiddenError extends AppError {
  constructor(message = "Forbidden - You don't have permission to access this resource") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * ConflictError - 409 Conflict
 * Used when request conflicts with current state (e.g., duplicate entry)
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT");
  }
}

/**
 * RateLimitError - 429 Too Many Requests
 * Used when rate limit is exceeded
 */
class RateLimitError extends AppError {
  constructor(message = "Too many requests - Please try again later") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
};
