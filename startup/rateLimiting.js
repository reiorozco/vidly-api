const rateLimit = require("express-rate-limit");
const config = require("../config/config");

// Rate limiter general para todas las rutas API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.RATE_LIMIT_MAX || 100,
  message: {
    error: "Too many requests",
    message: "Please try again later",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => config.NODE_ENV === "test", // Skip rate limiting in test environment
});

// Rate limiter estricto para autenticación (previene brute force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos máximo
  message: {
    error: "Too many login attempts",
    message: "Account temporarily locked. Try again in 15 minutes",
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  skip: (req) => config.NODE_ENV === "test",
});

// Rate limiter para creación de recursos (previene spam)
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones máximo por minuto
  message: {
    error: "Too many create requests",
    message: "Slow down! Max 10 creations per minute",
  },
  skip: (req) => config.NODE_ENV === "test",
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
};
