# Fase 4: Calidad y DevOps 🧪

**Estado:** ⏳ Pendiente (Requiere Fase 3)
**Prioridad:** 🟢 BAJA (pero importante)
**Duración estimada:** 3-5 días (20-30 horas)
**Prerequisitos:** Fases 1, 2 y 3 completadas
**Responsable:** Backend Developer + DevOps (part-time)

---

## Objetivos

Establecer un sistema de calidad y automatización que garantice la estabilidad a largo plazo del proyecto.

### Resultados Esperados

✅ Cobertura de tests >= 90%
✅ CI/CD pipeline funcional
✅ Pre-commit hooks activos
✅ API documentada con Swagger
✅ Health checks y métricas
✅ Dependabot configurado
✅ Monitoreo de errores con Sentry

---

## Tarea 4.1: Aumentar Cobertura de Tests

**Tiempo:** 8-10h | **Riesgo:** BAJO

### Análisis de Cobertura Actual

```bash
npm test -- --coverage --coverageReporters=text --coverageReporters=html
open coverage/index.html
```

### Áreas Sin Cobertura

1. **Middleware:**
   - `middleware/sanitizeUpdate.js` - ✅ Ya cubierto en Fase 1
   - `middleware/admin.js` - ❌ Sin tests
   - `middleware/async.js` - ❌ Sin tests
   - `middleware/correlationId.js` - ❌ Sin tests
   - `middleware/requestLogger.js` - ❌ Sin tests

2. **Startup Modules:**
   - `startup/config.js` - ⚠️ Cobertura parcial
   - `startup/logging.js` - ❌ Sin tests
   - `startup/validation.js` - ❌ Sin tests

3. **Utils:**
   - `utils/logger.js` - ❌ Sin tests
   - `validators/*` - ⚠️ Cobertura parcial

4. **Edge Cases:**
   - Manejo de errores de MongoDB
   - Conexión perdida a la base de datos
   - Tokens JWT expirados o inválidos
   - Operaciones concurrentes

### Tests Prioritarios

**tests/unit/middleware/admin.test.js:**
```javascript
const admin = require('../../../middleware/admin');

describe('admin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next if user is admin', () => {
    req.user.isAdmin = true;
    admin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if user is not admin', () => {
    req.user.isAdmin = false;
    admin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Access denied.');
  });

  it('should return 403 if user.isAdmin is undefined', () => {
    admin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
```

**tests/integration/security/jwt.test.js:**
```javascript
describe('JWT Security', () => {
  it('should reject expired tokens', async () => {
    // Crear token con expiración inmediata
    const user = new User({ name: 'test', email: 'test@test.com' });
    const token = jwt.sign(
      { _id: user._id },
      config.JWT_PRIVATE_KEY,
      { expiresIn: '1ms' }
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    const res = await request(server)
      .post('/api/genres')
      .set('x-auth-token', token)
      .send({ name: 'Test' });

    expect(res.status).toBe(400);
  });

  it('should reject malformed tokens', async () => {
    const res = await request(server)
      .post('/api/genres')
      .set('x-auth-token', 'malformed.token.here')
      .send({ name: 'Test' });

    expect(res.status).toBe(400);
  });
});
```

**tests/integration/resilience/database.test.js:**
```javascript
const mongoose = require('mongoose');

describe('Database Resilience', () => {
  it('should handle connection loss gracefully', async () => {
    // Simular pérdida de conexión
    await mongoose.connection.close();

    const res = await request(server).get('/api/genres');

    // Debería retornar error 500 pero no crashear
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();

    // Reconectar
    await mongoose.connect(config.DB);
  });
});
```

### Meta de Cobertura

```
Statements   : 90% (goal: 90%)
Branches     : 85% (goal: 85%)
Functions    : 90% (goal: 90%)
Lines        : 90% (goal: 90%)
```

---

## Tarea 4.2: CI/CD con GitHub Actions

**Tiempo:** 4-6h | **Riesgo:** BAJO

### Workflow Principal

**.github/workflows/ci.yml:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]
        mongodb-version: ['6.0', '7.0']

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Start MongoDB ${{ matrix.mongodb-version }}
        uses: supercharge/mongodb-github-action@v1.10.0
        with:
          mongodb-version: ${{ matrix.mongodb-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:ci
        env:
          NODE_ENV: test
          DB: mongodb://localhost:27017/vidly_test
          JWT_PRIVATE_KEY: test-secret-key-for-ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  security:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    name: Deploy to Vercel
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Branch Protection Rules

Configurar en GitHub:
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators

---

## Tarea 4.3: Pre-commit Hooks

**Tiempo:** 2h | **Riesgo:** BAJO

### Instalación

```bash
npm install --save-dev husky lint-staged
npx husky install
```

### Configuración

**package.json:**
```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests --passWithNoTests"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**.husky/pre-commit:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**.husky/pre-push:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run test:ci
```

---

## Tarea 4.4: Documentación con Swagger

**Tiempo:** 6-8h | **Riesgo:** BAJO

### Instalación

```bash
npm install swagger-ui-express swagger-jsdoc --save
```

### Configuración

**swagger/config.js:**
```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vidly API',
      version: '2.0.0',
      description: 'Movie rental service API',
      contact: {
        name: 'API Support',
        url: 'https://vidly-app.vercel.app'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://vidly-api.vercel.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-auth-token',
          description: 'JWT token'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './models/*.js']
};

module.exports = swaggerJsdoc(options);
```

### Documentar Rutas

**routes/GenresRoute.js:**
```javascript
/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres
 *     tags: [Genres]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of genres
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Genre'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get("/", paginate(), async (req, res) => {
  // ...
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Genre:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 21
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         name: Action
 */
```

### Endpoint de Docs

**api/index.js:**
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/config');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## Tarea 4.5: Health Checks y Métricas

**Tiempo:** 3-4h | **Riesgo:** BAJO

### Health Check Endpoint

**routes/HealthRoute.js:**
```javascript
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV
  };

  const statusCode = health.mongodb === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', async (req, res) => {
  try {
    // Check MongoDB
    await mongoose.connection.db.admin().ping();

    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

module.exports = router;
```

### Prometheus Metrics (Opcional)

```bash
npm install prom-client --save
```

**routes/MetricsRoute.js:**
```javascript
const client = require('prom-client');
const register = new client.Registry();

// Métricas por defecto
client.collectDefaultMetrics({ register });

// Métricas custom
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

router.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

module.exports = { router, httpRequestDuration };
```

---

## Tarea 4.6: Error Tracking con Sentry

**Tiempo:** 2-3h | **Riesgo:** BAJO

### Instalación

```bash
npm install @sentry/node --save
```

### Configuración

**startup/sentry.js:**
```javascript
const Sentry = require('@sentry/node');
const config = require('../config/config');

module.exports = function (app) {
  if (config.SENTRY_DSN) {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.NODE_ENV,
      tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0
    });

    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    // Error handler debe ir después de las rutas
    app.use(Sentry.Handlers.errorHandler());
  }
};
```

**api/index.js:**
```javascript
require("../startup/sentry")(app); // Antes de las rutas
require("../startup/routes")(app);
```

---

## Tarea 4.7: Dependabot

**Tiempo:** 1h | **Riesgo:** BAJO

**.github/dependabot.yml:**
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    reviewers:
      - "your-github-username"
    labels:
      - "dependencies"
      - "automated"
    versioning-strategy: increase
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

---

## Checklist General Fase 4

### Implementación
- [ ] 4.1: Cobertura >= 90%
- [ ] 4.2: CI/CD configurado
- [ ] 4.3: Pre-commit hooks
- [ ] 4.4: Swagger docs
- [ ] 4.5: Health checks
- [ ] 4.6: Sentry (opcional)
- [ ] 4.7: Dependabot

### Quality Gates
- [ ] Tests pasan en CI
- [ ] Linter pasa
- [ ] Audit sin vulnerabilidades
- [ ] Coverage >= 90%
- [ ] API docs completas

### Documentation
- [ ] README con badges
- [ ] API docs públicas
- [ ] Contributing guide
- [ ] Deployment docs

---

## Badges para README

```markdown
![CI](https://github.com/user/repo/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)
![npm version](https://img.shields.io/npm/v/vidly-project)
![License](https://img.shields.io/github/license/user/repo)
```

---

## Métricas de Éxito Final

| Métrica | Baseline | Final | ✅ |
|---------|----------|-------|---|
| CVEs | 6 | 0 | |
| Coverage | 60% | 90% | |
| CI/CD | ❌ | ✅ | |
| API Docs | ❌ | ✅ | |
| Automation | ❌ | ✅ | |

---

**Conclusión:** Proyecto production-ready y mantenible a largo plazo.
