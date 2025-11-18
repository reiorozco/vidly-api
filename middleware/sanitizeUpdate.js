/**
 * Input Sanitization Middleware
 *
 * Implements defense-in-depth against Prototype Pollution and MongoDB operator injection.
 * See docs/SECURITY-UPDATES.md for detailed explanation of these vulnerabilities.
 */

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * Recursively finds dangerous prototype pollution keys in an object
 *
 * @param {Object} obj - Object to check
 * @param {string} path - Current path (for error reporting)
 * @returns {string[]} Array of paths containing dangerous keys
 */
function findDangerousKeys(obj, path = '') {
  const found = [];

  if (typeof obj !== 'object' || obj === null) {
    return found;
  }

  const keys = Object.keys(obj);

  for (const key of keys) {
    const fullPath = path ? `${path}.${key}` : key;

    if (DANGEROUS_KEYS.includes(key)) {
      found.push(fullPath);
    }

    // Recursively check nested objects
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const nested = findDangerousKeys(obj[key], fullPath);
      found.push(...nested);
    }
  }

  return found;
}

/**
 * Middleware to sanitize request body against prototype pollution
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function sanitizeBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  const dangerous = findDangerousKeys(req.body);

  if (dangerous.length > 0) {
    return res.status(400).json({
      error: 'Solicitud inválida',
      message: 'La petición contiene propiedades prohibidas',
      ...(process.env.NODE_ENV !== 'production' && {
        details: dangerous
      })
    });
  }

  next();
}

/**
 * Middleware for update operations - blocks both prototype pollution and MongoDB operators
 *
 * MongoDB operators ($set, $inc, etc.) should only be used server-side, never from user input.
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function sanitizeUpdate(req, res, next) {
  // First apply general sanitization
  sanitizeBody(req, res, (err) => {
    if (err) {return next(err);}

    // Additional check for MongoDB operators
    if (req.body) {
      const mongoOperators = Object.keys(req.body).filter(key =>
        key.startsWith('$')
      );

      if (mongoOperators.length > 0) {
        return res.status(400).json({
          error: 'Solicitud inválida',
          message: 'No se permiten operadores de MongoDB en actualizaciones directas',
          ...(process.env.NODE_ENV !== 'production' && {
            operators: mongoOperators
          })
        });
      }
    }

    next();
  });
}

module.exports = {
  sanitizeBody,
  sanitizeUpdate,
  findDangerousKeys  // Exported for testing
};
