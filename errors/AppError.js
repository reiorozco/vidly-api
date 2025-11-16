/**
 * AppError - Base Error Class
 *
 * Custom error class for application-level errors.
 * All custom errors should extend this class.
 *
 * Properties:
 * - message: Error message
 * - statusCode: HTTP status code
 * - errorCode: Application-specific error code (e.g., 'VALIDATION_ERROR')
 * - isOperational: True for expected errors, false for programming errors
 * - timestamp: ISO timestamp when error occurred
 *
 * Usage:
 *   throw new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational; // Expected vs programming errors
    this.timestamp = new Date().toISOString();

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
