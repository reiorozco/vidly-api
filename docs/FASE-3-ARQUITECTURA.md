# Fase 3: Mejoras de Arquitectura - Guía Educativa

**Fecha:** 16 de noviembre de 2025
**Versión:** v2.1.0
**Autor:** Claude Code

---

## 🎯 Introducción

Este documento explica las mejoras arquitectónicas implementadas en la Fase 3 del proyecto Vidly API. Está diseñado para ser **educativo**, explicando no solo QUÉ se hizo, sino **POR QUÉ** y **CÓMO** funciona cada mejora.

### Objetivos de la Fase 3

1. **Escalabilidad** - Preparar la API para manejar más tráfico
2. **Mantenibilidad** - Código más organizado y fácil de modificar
3. **Observabilidad** - Mejor visibilidad de lo que ocurre en producción
4. **Developer Experience** - Herramientas que facilitan el desarrollo

---

## 📚 Conceptos Clave

### ¿Qué es Rate Limiting?

**Rate Limiting** es una técnica para controlar cuántas solicitudes puede hacer un cliente en un período de tiempo.

**Analogía:** Es como el límite de velocidad en una carretera. No puedes conducir más rápido que cierto límite para mantener la seguridad.

**¿Por qué es importante?**
- **Previene abuso:** Evita que alguien sobrecargue tu API con miles de requests
- **Protege recursos:** Tu base de datos y servidor tienen capacidad limitada
- **Mejora estabilidad:** Garantiza que usuarios legítimos puedan usar la API
- **Seguridad:** Previene ataques de fuerza bruta en login

**Ejemplo Real:**
```javascript
// Sin rate limiting: Un atacante puede intentar 10,000 passwords por segundo
POST /api/auth { email: "admin@example.com", password: "attempt1" }
POST /api/auth { email: "admin@example.com", password: "attempt2" }
// ... 9,998 intentos más

// Con rate limiting (5 intentos/15 minutos):
POST /api/auth { email: "admin@example.com", password: "attempt1" } // ✅
POST /api/auth { email: "admin@example.com", password: "attempt2" } // ✅
POST /api/auth { email: "admin@example.com", password: "attempt3" } // ✅
POST /api/auth { email: "admin@example.com", password: "attempt4" } // ✅
POST /api/auth { email: "admin@example.com", password: "attempt5" } // ✅
POST /api/auth { email: "admin@example.com", password: "attempt6" } // ❌ 429 Too Many Requests
```

### ¿Qué es Paginación?

**Paginación** divide grandes colecciones de datos en "páginas" más pequeñas.

**Analogía:** Como un libro dividido en páginas. No lees todo el libro de una vez, sino página por página.

**¿Por qué es importante?**
- **Performance:** Transferir 10,000 películas toma mucho tiempo
- **Memoria:** El cliente no puede cargar todo en memoria
- **UX:** El usuario no puede ver 10,000 items a la vez
- **Costo:** Menos ancho de banda = menos dinero

**Antes (sin paginación):**
```javascript
GET /api/movies
Response: [
  { id: 1, title: "Movie 1" },
  { id: 2, title: "Movie 2" },
  // ... 9,998 movies más
  { id: 10000, title: "Movie 10000" }
]
// Tamaño: ~5 MB
// Tiempo: ~10 segundos
```

**Después (con paginación):**
```javascript
GET /api/movies?page=1&limit=20
Response: {
  data: [
    { id: 1, title: "Movie 1" },
    // ... 19 movies más
  ],
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 500,
    totalItems: 10000,
    hasNext: true,
    hasPrev: false
  }
}
// Tamaño: ~10 KB
// Tiempo: ~100 ms
```

### ¿Qué son Correlation IDs?

**Correlation ID** es un identificador único que se asigna a cada request HTTP y se usa en todos los logs relacionados.

**Analogía:** Como un número de pedido en un restaurante. Puedes rastrear tu orden desde que la haces hasta que la recibes.

**¿Por qué es importante?**
- **Debugging:** Encuentra todos los logs de un request específico
- **Distributed Tracing:** Sigue un request a través de múltiples servicios
- **Support:** El usuario te da el correlation ID y tú puedes ver exactamente qué pasó

**Ejemplo:**
```javascript
// Request 1
GET /api/movies
Headers: { "X-Correlation-ID": "550e8400-e29b-41d4-a716-446655440000" }

// Logs generados (todos con el mismo ID):
[INFO] 550e8400... - HTTP Request GET /api/movies
[INFO] 550e8400... - Query DB: SELECT * FROM movies
[INFO] 550e8400... - Response 200 (duration: 45ms)

// Request 2
GET /api/genres
Headers: { "X-Correlation-ID": "7c9e6679-7425-40de-944b-e07fc1f90ae7" }

// Logs generados (ID diferente):
[INFO] 7c9e6679... - HTTP Request GET /api/genres
[ERROR] 7c9e6679... - DB Connection Failed
[ERROR] 7c9e6679... - Response 500 (duration: 120ms)
```

**Ventaja:** Si un usuario reporta un error, te da el correlation ID y puedes ver EXACTAMENTE qué salió mal.

### ¿Qué es Error Handling con Clases?

**Error Handling** estructurado usa clases de JavaScript para diferentes tipos de errores.

**Analogía:** Como tener diferentes formularios para diferentes problemas. Un formulario para quejas, otro para sugerencias, otro para devoluciones.

**¿Por qué es importante?**
- **Claridad:** Cada tipo de error tiene su propia clase
- **Consistencia:** Todos los errores 404 se manejan igual
- **Debugging:** Stack traces más útiles
- **API Contract:** Clientes saben qué esperar

**Antes (error handling básico):**
```javascript
// En diferentes partes del código:
res.status(404).send("Not found");
res.status(404).send("Genre not found");
res.status(404).send("The requested resource doesn't exist");

// Problema: Inconsistente, difícil de documentar
```

**Después (con clases de error):**
```javascript
throw new NotFoundError("Genre");

// Resultado consistente:
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Genre not found",
    "correlationId": "550e8400..."
  }
}
```

---

## 🛠️ Implementaciones Detalladas

### 1. Rate Limiting

**Implementación:**
```javascript
// startup/rateLimiting.js
const rateLimit = require("express-rate-limit");

// Limiter general para toda la API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 requests máximo
  message: {
    error: "Too many requests",
    message: "Please try again later",
    retryAfter: "15 minutes"
  },
  skip: (req) => config.NODE_ENV === "test"  // Desactivar en tests
});

// Limiter específico para login (más estricto)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Solo 5 intentos
  skipSuccessfulRequests: true  // No contar logins exitosos
});
```

**Cómo funciona:**
1. `express-rate-limit` almacena un contador por IP address
2. Cada request incrementa el contador
3. Si se excede el límite, retorna 429 Too Many Requests
4. El contador se resetea después de `windowMs`

**Aplicación:**
```javascript
// Proteger toda la API
app.use("/api", generalLimiter);

// Proteger específicamente el login
router.post("/api/auth", authLimiter, loginHandler);
```

### 2. Paginación

**Implementación:**
```javascript
// middleware/paginate.js
function paginate(options = {}) {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  return (req, res, next) => {
    // Extraer page y limit de query params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit));

    // Calcular skip para MongoDB
    const skip = (page - 1) * limit;

    // Agregar al request
    req.pagination = { page, limit, skip };

    // Helper para responder con paginación
    res.paginatedResponse = function(data, totalCount) {
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
```

**Uso en una ruta:**
```javascript
router.get("/", paginate(), async (req, res) => {
  const { skip, limit } = req.pagination;

  // Query en paralelo para eficiencia
  const [genres, total] = await Promise.all([
    Genre.find({}).sort({ name: "asc" }).skip(skip).limit(limit),
    Genre.countDocuments({})
  ]);

  // Usar el helper
  res.paginatedResponse(genres, total);
});
```

**Query examples:**
```bash
# Primera página (default)
GET /api/movies
# Retorna: items 1-20

# Segunda página
GET /api/movies?page=2
# Retorna: items 21-40

# Cambiar tamaño de página
GET /api/movies?page=1&limit=50
# Retorna: items 1-50

# Máximo permitido
GET /api/movies?page=1&limit=200
# Retorna: items 1-100 (max limit es 100)
```

### 3. Correlation IDs

**Implementación:**
```javascript
// middleware/correlationId.js
const crypto = require("crypto");

function correlationId(req, res, next) {
  // Usar ID del cliente o generar uno nuevo
  req.id = req.headers["x-correlation-id"] || crypto.randomUUID();

  // Echar el ID de vuelta al cliente
  res.setHeader("X-Correlation-ID", req.id);

  next();
}
```

**¿Por qué crypto.randomUUID()?**
- Es built-in en Node 18+ (no necesita dependencias)
- Genera UUIDs v4 válidos
- Más rápido que librerías externas
- Evita problemas de compatibilidad con ES modules

**Uso con logging:**
```javascript
// middleware/requestLogger.js
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP Request", {
      correlationId: req.id,  // ← Incluir en cada log
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}
```

**Flujo completo:**
```
1. Request llega
   ↓
2. correlationId middleware
   - Genera ID: "550e8400-e29b-41d4-a716-446655440000"
   - Agrega a req.id
   - Agrega a response headers
   ↓
3. Request se procesa
   - Todos los logs incluyen req.id
   ↓
4. Response sale
   - Header: X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 4. Error Handling con Clases

**Jerarquía de errores:**
```javascript
AppError (base)
  ├── ValidationError (400)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  ├── NotFoundError (404)
  ├── ConflictError (409)
  └── RateLimitError (429)
```

**Clase base:**
```javascript
// errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;  // ← KEY
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**¿Qué es `isOperational`?**
- `true`: Error esperado (validación falla, recurso no existe)
- `false`: Error inesperado (bug en el código, base de datos caída)

**Clases específicas:**
```javascript
class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;  // Detalles de Joi
  }
}
```

**Uso:**
```javascript
// Antes
if (!genre) {
  return res.status(404).send("Genre not found");
}

// Después
if (!genre) {
  throw new NotFoundError("Genre");
}
```

**Error handler mejorado:**
```javascript
// middleware/error.js
function errorHandler(err, req, res, next) {
  const correlationId = req.id;

  // Error operacional (esperado)
  if (err.isOperational) {
    logger.warn("Operational error", {
      correlationId,
      errorCode: err.errorCode,
      message: err.message
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        correlationId
      }
    });
  }

  // Programming error (bug)
  logger.error("Unexpected error", {
    correlationId,
    error: err.message,
    stack: err.stack
  });

  // NO mostrar detalles internos en producción
  const message = config.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : err.message;

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
      correlationId
    }
  });
}
```

### 5. Validación de Configuración

**Implementación:**
```javascript
// config/config.js
const Joi = require("joi");

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  DB: Joi.string().required(),

  JWT_PRIVATE_KEY: Joi.string()
    .min(32)  // Al menos 32 caracteres
    .required(),

  PORT: Joi.number()
    .port()   // Validar que sea un puerto válido
    .default(3000),

  RATE_LIMIT_MAX: Joi.number()
    .integer()
    .positive()
    .default(100)
}).unknown(true);  // Permitir otras variables

// Validar
const { error, value: config } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = config;
```

**Beneficios:**
1. **Fail-fast:** App no arranca si la config es inválida
2. **Documentación:** El schema documenta qué variables se necesitan
3. **Type safety:** Joi valida tipos y rangos
4. **Defaults:** Valores por defecto claros

---

## 🎓 Mejores Prácticas Aprendidas

### 1. Rate Limiting

**DO:**
✅ Usa diferentes límites para diferentes endpoints
✅ Deshabilita en tests (usa `skip` option)
✅ Proporciona mensajes claros al usuario
✅ Incluye `retryAfter` en la respuesta

**DON'T:**
❌ No uses el mismo límite para todo
❌ No bloquees IPs permanentemente (usa ventanas de tiempo)
❌ No apliques rate limiting a health checks

### 2. Paginación

**DO:**
✅ Incluye metadata (totalItems, hasNext, etc.)
✅ Establece límites máximos razonables
✅ Usa `Promise.all()` para queries paralelas
✅ Documenta el formato de paginación

**DON'T:**
❌ No permitas límites ilimitados
❌ No hagas dos queries secuenciales (usa Promise.all)
❌ No cambies el formato sin versionar la API

### 3. Correlation IDs

**DO:**
✅ Genera IDs únicos (UUIDs)
✅ Incluye en TODOS los logs
✅ Retorna en response headers
✅ Acepta IDs del cliente

**DON'T:**
❌ No uses IDs secuenciales (1, 2, 3...)
❌ No omitas el ID en algunos logs
❌ No uses el mismo ID para múltiples requests

### 4. Error Handling

**DO:**
✅ Usa clases específicas para cada tipo de error
✅ Incluye correlation IDs
✅ Oculta stack traces en producción
✅ Distingue errores operacionales de bugs

**DON'T:**
❌ No expongas detalles internos en producción
❌ No uses status codes inconsistentes
❌ No retornes strings planos (usa JSON)

---

## 📊 Impacto de las Mejoras

### Antes de Fase 3

```javascript
// Sin rate limiting
// → Vulnerable a ataques de fuerza bruta

// Sin paginación
GET /api/movies
// → 10,000 movies = 5 MB = 10 segundos

// Sin correlation IDs
[ERROR] Database connection failed
[ERROR] User authentication failed
// → ¿Cuál error es del request que falló?

// Error handling básico
res.status(500).send("Something failed");
// → No hay contexto, no hay correlation ID
```

### Después de Fase 3

```javascript
// Con rate limiting
// → 5 intentos de login/15 min
// → Protección contra brute force

// Con paginación
GET /api/movies?page=1&limit=20
// → 20 movies = 10 KB = 100 ms

// Con correlation IDs
[ERROR] 550e8400... - Database connection failed
[ERROR] 550e8400... - User authentication failed
// → Ambos del mismo request!

// Error handling estructurado
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
// → Usuario nos da el ID, encontramos el problema
```

---

## 🔮 Próximos Pasos

### Mejoras Futuras Recomendadas

1. **Caché de Respuestas**
   - Redis para cachear queries frecuentes
   - Reduce carga en base de datos
   - Mejora tiempos de respuesta

2. **Métricas de Performance**
   - Prometheus + Grafana
   - Monitorear latencia por endpoint
   - Alertas automáticas

3. **Distributed Tracing**
   - Jaeger o Zipkin
   - Seguir requests a través de microservicios
   - Visualizar cuellos de botella

4. **GraphQL**
   - Reemplazar REST con GraphQL
   - Clientes piden exactamente lo que necesitan
   - Reduce over-fetching

---

## 📚 Recursos de Aprendizaje

### Rate Limiting
- [OWASP: Denial of Service](https://owasp.org/www-community/attacks/Denial_of_Service)
- [express-rate-limit docs](https://github.com/express-rate-limit/express-rate-limit)

### Paginación
- [Cursor-based vs Offset-based Pagination](https://slack.engineering/evolving-api-pagination-at-slack/)
- [REST API Pagination Best Practices](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/)

### Correlation IDs
- [Distributed Tracing](https://opentelemetry.io/docs/concepts/observability-primer/)
- [Request IDs Best Practices](https://blog.heroku.com/http_request_id_s_improve_visibility_across_the_application_stack)

### Error Handling
- [Error Handling in Node.js](https://www.joyent.com/node-js/production/design/errors)
- [Operational vs Programmer Errors](https://www.joyent.com/node-js/production/design/errors#operational-errors-vs-programmer-errors)

---

## ✅ Checklist de Validación

Usa esta lista para validar que implementaste correctamente cada mejora:

### Rate Limiting
- [ ] Diferentes límites para diferentes rutas
- [ ] Deshabilitado en tests
- [ ] Mensajes descriptivos al usuario
- [ ] Aplicado a rutas críticas (auth)

### Paginación
- [ ] Middleware reutilizable
- [ ] Límite máximo configurado
- [ ] Metadata incluida (totalItems, hasNext)
- [ ] Tests actualizados

### Correlation IDs
- [ ] UUIDs únicos generados
- [ ] Incluidos en todos los logs
- [ ] Retornados en response headers
- [ ] Cliente puede proveer su propio ID

### Error Handling
- [ ] Clases de error específicas
- [ ] Correlation IDs en respuestas de error
- [ ] Stack traces ocultos en producción
- [ ] isOperational flag implementado

### Configuración
- [ ] Schema Joi definido
- [ ] Validación fail-fast
- [ ] Valores por defecto documentados
- [ ] Types validados

---

**¡Felicitaciones!** Has completado la Fase 3 de mejoras arquitectónicas. Tu API ahora es más escalable, mantenible y observable. 🚀
