# Fase 3: Mejoras de Arquitectura 🏗️

**Estado:** ⏳ Pendiente (Requiere Fase 2)
**Prioridad:** 🟡 MEDIA
**Duración estimada:** 5-7 días (32-40 horas)
**Prerequisitos:** Fases 1 y 2 completadas
**Responsable:** Backend Developer

---

## Objetivos

Refactorizar la arquitectura para mejorar escalabilidad, mantenibilidad y experiencia del desarrollador, sin cambios disruptivos en la API pública.

### Resultados Esperados

✅ Rate limiting implementado
✅ Validación centralizada y mejorada
✅ Paginación estándar en todos los listados
✅ Logging estructurado con correlation IDs
✅ Manejo de errores robusto con códigos consistentes
✅ Configuración validada y tipada

---

## Tarea 3.1: Rate Limiting

**Tiempo:** 3-4h | **Riesgo:** BAJO

### Implementación

```bash
npm install express-rate-limit --save
```

**startup/rateLimiting.js:**
```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

// Rate limiter general para todas las rutas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: config.RATE_LIMIT_MAX || 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.NODE_ENV === 'test'
});

// Rate limiter estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Try again in 15 minutes'
  },
  skipSuccessfulRequests: true
});

// Rate limiter para creación de recursos
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: {
    error: 'Too many create requests',
    message: 'Slow down! Max 10 creations per minute'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter
};
```

**Aplicar en api/index.js:**
```javascript
const { generalLimiter } = require('./startup/rateLimiting');

if (config.NODE_ENV === 'production') {
  require("../startup/prod")(app);
  app.use('/api', generalLimiter);
}
```

**Aplicar en routes/AuthRoute.js:**
```javascript
const { authLimiter } = require('../startup/rateLimiting');

router.post("/", authLimiter, validate(validateAuth), async (req, res) => {
  // ...
});
```

### Testing

```javascript
describe('Rate Limiting', () => {
  it('should limit auth attempts', async () => {
    const credentials = { email: 'test@test.com', password: 'wrong' };

    // Hacer 6 intentos
    for (let i = 0; i < 6; i++) {
      const res = await request(server)
        .post('/api/auth')
        .send(credentials);

      if (i < 5) {
        expect(res.status).not.toBe(429);
      } else {
        expect(res.status).toBe(429);
        expect(res.body.error).toContain('Too many');
      }
    }
  });
});
```

---

## Tarea 3.2: Validación Centralizada

**Tiempo:** 6-8h | **Riesgo:** MEDIO

### Estructura Propuesta

```
validators/
  ├── schemas/
  │   ├── genreSchema.js
  │   ├── userSchema.js
  │   ├── movieSchema.js
  │   ├── customerSchema.js
  │   └── rentalSchema.js
  ├── customValidators.js
  ├── index.js
  └── errorFormatter.js
```

### Implementación

**validators/schemas/genreSchema.js:**
```javascript
const Joi = require('joi');

const genreSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(21)
    .required()
    .trim()
    .messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 21 caracteres',
      'any.required': 'El nombre es requerido'
    })
});

const genreUpdateSchema = genreSchema.fork(['name'], (schema) =>
  schema.optional()
);

module.exports = {
  genreSchema,
  genreUpdateSchema
};
```

**validators/customValidators.js:**
```javascript
const Joi = require('joi');
const mongoose = require('mongoose');

// Validador custom para ObjectId
const objectId = () =>
  Joi.string()
    .length(24)
    .hex()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid': 'ID inválido'
    });

// Validador para emails
const email = () =>
  Joi.string()
    .email({ minDomainSegments: 2 })
    .lowercase()
    .trim();

// Validador para passwords
const password = () =>
  Joi.string()
    .min(8)
    .max(255)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, and numbers'
    });

module.exports = {
  objectId,
  email,
  password
};
```

**validators/index.js:**
```javascript
const { genreSchema, genreUpdateSchema } = require('./schemas/genreSchema');
// ... otras schemas

const errorFormatter = require('./errorFormatter');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const formatted = errorFormatter(error);
      return res.status(400).json(formatted);
    }

    // Reemplazar req.body con valor sanitizado
    req.body = value;
    next();
  };
}

module.exports = {
  validate,
  schemas: {
    genre: genreSchema,
    genreUpdate: genreUpdateSchema
    // ...
  }
};
```

---

## Tarea 3.3: Paginación Estándar

**Tiempo:** 4-5h | **Riesgo:** BAJO

### Middleware de Paginación

**middleware/paginate.js:**
```javascript
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function paginate(options = {}) {
  const {
    defaultLimit = DEFAULT_LIMIT,
    maxLimit = MAX_LIMIT
  } = options;

  return (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
    const limit = Math.min(
      maxLimit,
      Math.max(1, parseInt(req.query.limit) || defaultLimit)
    );
    const skip = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      skip
    };

    // Función helper para responder con paginación
    res.paginatedResponse = function (data, totalCount) {
      const totalPages = Math.ceil(totalCount / limit);

      return res.json({
        data,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    };

    next();
  };
}

module.exports = paginate;
```

### Aplicar en Rutas

**routes/GenresRoute.js:**
```javascript
const paginate = require('../middleware/paginate');

router.get("/", paginate(), async (req, res) => {
  const { skip, limit } = req.pagination;

  const [genres, total] = await Promise.all([
    Genre.find({})
      .sort({ name: 'asc' })
      .skip(skip)
      .limit(limit),
    Genre.countDocuments({})
  ]);

  res.paginatedResponse(genres, total);
});
```

---

## Tarea 3.4: Logging Estructurado

**Tiempo:** 5-6h | **Riesgo:** BAJO

### Correlation IDs

**middleware/correlationId.js:**
```javascript
const { v4: uuidv4 } = require('uuid');

function correlationId(req, res, next) {
  req.id = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('X-Correlation-ID', req.id);
  next();
}

module.exports = correlationId;
```

### Logger Estructurado

**utils/logger.js:**
```javascript
const winston = require('winston');
const config = require('../config/config');

const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'vidly-api',
    environment: config.NODE_ENV
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper para logs con contexto
logger.withContext = (context) => {
  return {
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta })
  };
};

module.exports = logger;
```

### Logging Middleware

**middleware/requestLogger.js:**
```javascript
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      correlationId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
}

module.exports = requestLogger;
```

---

## Tarea 3.5: Manejo de Errores Mejorado

**Tiempo:** 6-8h | **Riesgo:** MEDIO

### Clases de Error

**errors/AppError.js:**
```javascript
class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

**errors/index.js:**
```javascript
const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};
```

### Error Handler Mejorado

**middleware/error.js:**
```javascript
const logger = require('../utils/logger');
const { AppError } = require('../errors');
const config = require('../config/config');

module.exports = function (err, req, res, next) {
  const correlationId = req.id;

  // Error operacional esperado
  if (err.isOperational) {
    logger.warn('Operational error', {
      correlationId,
      errorCode: err.errorCode,
      message: err.message,
      statusCode: err.statusCode
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        ...(err.details && { details: err.details }),
        correlationId
      }
    });
  }

  // Error inesperado
  logger.error('Unexpected error', {
    correlationId,
    error: err.message,
    stack: err.stack
  });

  // En producción, no exponer detalles internos
  const message = config.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      correlationId,
      ...(config.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};
```

---

## Tarea 3.6: Configuración Mejorada

**Tiempo:** 4h | **Riesgo:** BAJO

**config/index.js:**
```javascript
const Joi = require('joi');
require('dotenv').config({
  path: `env/${process.env.NODE_ENV || 'development'}.env`
});

// Schema de validación
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB: Joi.string().required(),

  // Server
  HOST: Joi.string().default('127.0.0.1'),
  PORT: Joi.number().default(3000),

  // Auth
  JWT_PRIVATE_KEY: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_MAX: Joi.number().default(100),
  RATE_LIMIT_WINDOW: Joi.number().default(15),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000')
})
  .unknown(true);

// Validar y extraer config
const { error, value: config } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = config;
```

---

## Checklist General Fase 3

### Implementación
- [ ] 3.1: Rate limiting
- [ ] 3.2: Validación centralizada
- [ ] 3.3: Paginación
- [ ] 3.4: Logging estructurado
- [ ] 3.5: Error handling
- [ ] 3.6: Configuración

### Testing
- [ ] Tests pasan
- [ ] Cobertura >= 85%
- [ ] Rate limits funcionan
- [ ] Paginación funciona
- [ ] Logs estructurados

### Documentación
- [ ] API docs actualizadas
- [ ] Error codes documentados
- [ ] CLAUDE.md actualizado

---

**Próximos pasos:** Fase 4 - Calidad y DevOps
