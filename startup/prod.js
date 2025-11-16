/**
 * Production Middleware Configuration
 *
 * Configures security headers, compression, and CORS for production environment.
 * See docs/SECURITY-UPDATES.md for detailed security explanations.
 */

const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");

module.exports = function (app) {
  /**
   * Helmet - Security Headers
   *
   * Configures CSP, HSTS, X-Frame-Options, and other security headers.
   * Note: unsafe-inline in styleSrc is for Pug template compatibility.
   */
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],  // Pug compatibility
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,  // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  /**
   * Compression - Gzip compression for responses
   * Reduces response size by 60-80% for JSON/text
   */
  app.use(compression());

  /**
   * CORS - Cross-Origin Resource Sharing
   *
   * Whitelist of allowed origins. Never use "*" in production.
   */
  app.use(
    cors({
      origin: [
        "https://vidly-app-six.vercel.app",
        "https://vidly-app-reiorozco.vercel.app",
        "https://vidly-app-git-master-reiorozco.vercel.app",
        "https://vidly-akapc4006-reiorozco.vercel.app",
        "http://localhost:3000",  // Local development
      ],
      credentials: true,  // Allow JWT in headers
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "x-auth-token"],
      exposedHeaders: ["x-auth-token"],
      maxAge: 600,  // Cache preflight for 10 minutes
    })
  );
};
