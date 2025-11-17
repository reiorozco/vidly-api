# Fase 4: Quality & DevOps - Guía Educativa

**Versión:** 2.2.0
**Fecha:** Noviembre 2024
**Objetivo:** Implementar prácticas de calidad y automatización para asegurar la confiabilidad del sistema

---

## 📚 Tabla de Contenidos

1. [Introducción](#introducción)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Health Check Endpoints](#health-check-endpoints)
4. [API Documentation (Swagger)](#api-documentation-swagger)
5. [Testing Best Practices](#testing-best-practices)
6. [Recursos de Aprendizaje](#recursos-de-aprendizaje)

---

## Introducción

La Fase 4 se enfoca en **calidad y automatización**. Implementamos herramientas y procesos que:

- **Previenen bugs** antes de que lleguen a producción (CI/CD)
- **Facilitan el monitoreo** del estado del servicio (Health Checks)
- **Simplifican el uso** de la API (Swagger Documentation)
- **Garantizan la confiabilidad** mediante tests automatizados

### Analogía: Fábrica de Automóviles

Imagina que nuestra API es una fábrica de automóviles:

- **CI/CD** = Línea de ensamblaje automatizada que verifica cada pieza
- **Health Checks** = Luces del tablero que indican el estado del motor
- **Swagger** = Manual del usuario interactivo con instrucciones claras
- **Tests** = Pruebas de calidad (crash tests, emisiones, seguridad)

Sin estos controles de calidad, estaríamos enviando autos defectuosos a los clientes. Lo mismo aplica al software.

---

## CI/CD Pipeline

### ¿Qué es CI/CD?

**CI (Continuous Integration)**: Integrar código frecuentemente y verificarlo automáticamente
**CD (Continuous Deployment)**: Desplegar automáticamente código que pasa todas las verificaciones

### Analogía: Control de Seguridad en el Aeropuerto

Antes de abordar un avión (deployment), pasas por varios controles:

1. **Check-in** (Código se sube a Git)
2. **Escaneo de equipaje** (Tests automatizados)
3. **Detector de metales** (Security audit)
4. **Revisión de documentos** (Lint checks)
5. **Verificación de pasaporte** (Build verification)

Si fallas cualquier control, no abordas el avión. Lo mismo con el código: si falla un test, no se despliega.

### Implementación: GitHub Actions

**Archivo:** `.github/workflows/ci.yml`

#### Job 1: Test & Coverage

```yaml
test:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      node-version: [18.x, 20.x]  # Probar en múltiples versiones
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci                 # Install determinista
    - run: npm run test:ci        # Tests con coverage
    - uses: codecov/codecov-action@v4  # Reporte de coverage
```

**¿Por qué probar en múltiples versiones de Node?**
- Node 18.x = LTS actual (Long Term Support)
- Node 20.x = Versión más reciente
- Garantiza compatibilidad hacia adelante

**`npm ci` vs `npm install`:**
- `npm ci` = Instala EXACTAMENTE lo que dice `package-lock.json`
- `npm install` = Puede actualizar dependencias
- En CI, queremos builds reproducibles → usamos `npm ci`

#### Job 2: Security Audit

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - run: npm audit --production --audit-level=moderate
    - run: npm audit --production
```

**Dos niveles de verificación:**
1. **Moderate**: Advertencias, no falla el build
2. **Production**: Solo dependencias de producción, falla si hay vulnerabilidades

**¿Por qué `--production`?**
- DevDependencies (Jest, ESLint) solo se usan en desarrollo
- Vulnerabilidades en dev dependencies no afectan producción
- Reducimos falsos positivos

#### Job 3: Lint (Calidad de Código)

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - run: npx eslint . --ext .js
      continue-on-error: true  # No bloquea el build
```

**ESLint** detecta:
- Variables no usadas
- Código inalcanzable
- Convenciones de estilo inconsistentes
- Posibles bugs (== vs ===, missing await)

**`continue-on-error: true`**: Advertimos pero no bloqueamos. Útil cuando estás adoptando ESLint gradualmente.

#### Job 4: Build Check

```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - run: node -c api/index.js     # Verifica sintaxis
    - run: npm pkg fix --dry-run    # Valida package.json
```

**`node -c`**: Verifica sintaxis sin ejecutar
**`npm pkg fix --dry-run`**: Valida package.json sin modificarlo

#### Job 5: Health Check Endpoints

```yaml
health-check:
  runs-on: ubuntu-latest
  needs: [test]  # Solo corre si test pasa
  steps:
    - run: npm start &             # Inicia servidor en background
    - run: sleep 5                 # Espera que arranque
    - run: curl http://localhost:3000/health
    - run: curl http://localhost:3000/ready
```

**`needs: [test]`**: Dependencia explícita entre jobs
**Background execution (`&`)**: Permite que el servidor corra mientras hacemos requests

### Beneficios del CI/CD

✅ **Detección temprana de bugs** (minutos vs. días)
✅ **Confianza para hacer cambios** (los tests te cubren)
✅ **Documentación ejecutable** (el pipeline describe qué debe funcionar)
✅ **Onboarding más rápido** (nuevos devs ven estándares en el pipeline)

### Métricas Clave

- **Build Time**: Debe ser < 10 minutos (nuestro: ~5 min)
- **Pass Rate**: Meta > 95% (no queremos builds rojos constantes)
- **Flaky Tests**: Tests que fallan aleatoriamente = 0 tolerancia

---

## Health Check Endpoints

### ¿Por qué Health Checks?

En producción con múltiples instancias del servicio:

- **Load Balancers** necesitan saber a qué instancias enviar tráfico
- **Kubernetes** necesita saber cuándo reiniciar pods
- **Monitoreo** necesita alertar cuando algo está mal

### Diferencia: Liveness vs. Readiness

| Aspecto | `/health` (Liveness) | `/ready` (Readiness) |
|---------|---------------------|---------------------|
| **Pregunta** | ¿Está vivo el proceso? | ¿Puede manejar tráfico? |
| **Verifica** | Solo el proceso Node | Proceso + MongoDB |
| **Acción si falla** | Reiniciar el pod | No enviar tráfico (temporalmente) |
| **Rapidez** | < 100ms | < 500ms |

### Analogía: Médico en un Hospital

**Liveness Check** = ¿Tiene pulso el médico?
- Si no → Reemplazar el médico

**Readiness Check** = ¿Tiene el médico acceso a equipos médicos?
- Si no → No asignar pacientes (pero el médico sigue vivo)

### Implementación: `/health`

```javascript
router.get("/health", (req, res) => {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: require("../package.json").version,
    node: process.version,
  };

  res.status(200).json(healthData);
});
```

**Características:**
- ✅ **No depende de servicios externos** (siempre responde si Node está vivo)
- ✅ **Rápido** (< 10ms típicamente)
- ✅ **Información útil** para debugging (uptime, version)

### Implementación: `/ready`

```javascript
router.get("/ready", async (req, res) => {
  try {
    // Verificar estado de conexión
    const mongoState = mongoose.connection.readyState;
    const isMongoReady = mongoState === 1; // 1 = connected

    if (!isMongoReady) {
      return res.status(503).json({
        status: "not ready",
        checks: {
          mongodb: {
            status: "unhealthy",
            state: getMongoStateDescription(mongoState)
          }
        }
      });
    }

    // Ping activo para verificar responsividad
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: "ready",
      checks: { mongodb: { status: "healthy", state: "connected" } }
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      checks: { mongodb: { status: "unhealthy", error: error.message } }
    });
  }
});
```

**Estados de MongoDB:**
- `0` = Disconnected
- `1` = Connected
- `2` = Connecting
- `3` = Disconnecting

**¿Por qué 503 (Service Unavailable)?**
- No es un error del cliente (400) ni del servidor (500)
- Es temporal: el servicio está vivo pero no listo
- Load balancers reconocen 503 y dejan de enviar tráfico

### Patrón: Health Checks Primero

```javascript
// startup/routes.js
app.use(healthRoute);  // ← PRIMERO, antes de cualquier middleware
app.use("/api-docs", swaggerUi.serve);
app.use(correlationId);
app.use(requestLogger);
// ... más middleware
```

**¿Por qué primero?**
- Si el rate limiter bloquea, health checks dejan de funcionar
- Si MongoDB está caído, queremos reportarlo aunque el auth middleware falle
- Health checks deben ser la ruta más confiable

### Uso en Kubernetes

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: vidly-api
      image: vidly-api:2.2.0
      livenessProbe:
        httpGet:
          path: /health
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 30
      readinessProbe:
        httpGet:
          path: /ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
```

---

## API Documentation (Swagger)

### ¿Por qué Swagger/OpenAPI?

Sin documentación:
- Devs pierden horas adivinando formatos de request/response
- Errores de integración entre frontend y backend
- Onboarding lento para nuevos desarrolladores

Con Swagger:
- ✅ Documentación **siempre actualizada** (vive con el código)
- ✅ **Interfaz interactiva** para probar endpoints (Postman integrado)
- ✅ **Generación de clientes** automática (TypeScript, Python, Java)

### Analogía: IKEA Instructions

**Sin Swagger** = Comprar muebles sin instrucciones (adivinas cómo armarlos)
**Con Swagger** = Instrucciones visuales paso a paso + herramientas incluidas

### Arquitectura Swagger

```
┌─────────────────────────────────────────┐
│  config/swagger.js                      │
│  - OpenAPI 3.0 definition               │
│  - Schemas (Genre, User, Movie...)      │
│  - Security schemes (x-auth-token)      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  routes/*.js                            │
│  - JSDoc comments (@swagger)            │
│  - Endpoint specifications              │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  swagger-jsdoc                          │
│  - Parsea JSDoc + config                │
│  - Genera OpenAPI JSON                  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  swagger-ui-express                     │
│  - Renderiza UI interactiva             │
│  - Disponible en /api-docs              │
└─────────────────────────────────────────┘
```

### Configuración: `config/swagger.js`

#### 1. Metadata de la API

```javascript
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vidly API",
      version: "2.2.0",
      description: "RESTful API for movie rental service",
      contact: { name: "API Support" },
      license: { name: "ISC" }
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      { url: "https://api.vidly.com", description: "Production" }
    ]
  }
};
```

#### 2. Security Schemes

```javascript
securitySchemes: {
  bearerAuth: {
    type: "apiKey",
    name: "x-auth-token",
    in: "header",
    description: "JWT token for authentication"
  }
}
```

**OpenAPI soporta:**
- `apiKey`: Nuestro caso (header personalizado)
- `http`: Basic Auth, Bearer Token estándar
- `oauth2`: OAuth 2.0 flows
- `openIdConnect`: OpenID Connect

#### 3. Schemas Reutilizables

```javascript
schemas: {
  Genre: {
    type: "object",
    properties: {
      _id: { type: "string", example: "507f1f77bcf86cd799439011" },
      name: { type: "string", minLength: 3, maxLength: 50 }
    },
    required: ["name"]
  },
  Pagination: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      totalPages: { type: "integer", example: 5 },
      totalItems: { type: "integer", example: 50 }
    }
  }
}
```

**Ventaja de schemas:** Define una vez, reutiliza en todos los endpoints con `$ref`.

### Documentando Endpoints: JSDoc

#### Ejemplo: GET /api/genres

```javascript
/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres with pagination
 *     tags: [Genres]
 *     security: []  # Público, no requiere auth
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of genres
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
  // Implementation...
});
```

#### Ejemplo: POST /api/genres (Requiere Auth)

```javascript
/**
 * @swagger
 * /api/genres:
 *   post:
 *     summary: Create a new genre
 *     tags: [Genres]
 *     security:
 *       - bearerAuth: []  # Requiere x-auth-token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Genre created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Genre'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/", [auth, sanitizeBody], async (req, res) => {
  // Implementation...
});
```

**Reutilización de respuestas:**
```javascript
responses: {
  Unauthorized: {
    description: "Access token is missing or invalid",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
  }
}
```

Luego: `$ref: '#/components/responses/Unauthorized'`

### Uso de Swagger UI

1. **Navega a:** `http://localhost:3000/api-docs`
2. **Explora endpoints** organizados por tags (Health, Genres, Auth...)
3. **Prueba un endpoint:**
   - Click en `POST /api/genres`
   - Click "Try it out"
   - Ingresa datos de ejemplo
   - Agrega `x-auth-token` en Authorization
   - Click "Execute"
4. **Copia código generado** (curl, JavaScript, Python...)

### Best Practices

✅ **Documenta mientras codeas** (no después)
✅ **Usa ejemplos realistas** (no "string", sino "Sci-Fi")
✅ **Especifica límites** (minLength, maxLength, min, max)
✅ **Documenta todos los códigos de estado** (200, 400, 401, 404, 500)
✅ **Agrupa con tags** (facilita navegación)

---

## Testing Best Practices

### Pirámide de Testing

```
          ╱╲          E2E Tests (Pocos, lentos, frágiles)
         ╱  ╲         - Selenium, Cypress
        ╱────╲
       ╱      ╲       Integration Tests (Algunos, moderados)
      ╱────────╲      - Supertest, API tests
     ╱          ╲
    ╱────────────╲    Unit Tests (Muchos, rápidos, confiables)
   ╱──────────────╲   - Jest, funciones puras
  ╱────────────────╲
```

**Regla 70-20-10:**
- 70% Unit tests
- 20% Integration tests
- 10% E2E tests

### Unit vs Integration Tests

| Aspecto | Unit | Integration |
|---------|------|-------------|
| **Scope** | Función/clase aislada | Múltiples componentes |
| **Velocidad** | < 10ms | 100-500ms |
| **Dependendencias** | Mocks | Reales (DB, HTTP) |
| **Ejemplo** | `validateGenre()` | `POST /api/genres` |

### Tests de Health Endpoints

**Archivo:** `tests/integration/health.test.js`

#### Test 1: Contrato de respuesta

```javascript
it("should return 200 with health status", async () => {
  const res = await request(server).get("/health");

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("status", "healthy");
  expect(res.body).toHaveProperty("timestamp");
  expect(res.body).toHaveProperty("uptime");
  expect(res.body).toHaveProperty("version");
});
```

**¿Por qué verificar cada campo?**
- Frontend/monitoreo dependen de estos campos
- Si cambiamos el contrato sin saberlo, romperemos clientes
- Tests = Contrato ejecutable

#### Test 2: Validación de datos

```javascript
it("should return valid timestamp format", async () => {
  const res = await request(server).get("/health");

  const timestamp = new Date(res.body.timestamp);
  expect(timestamp).toBeInstanceOf(Date);
  expect(timestamp.getTime()).not.toBeNaN();
});
```

**Date parsing puede fallar silenciosamente:**
- `new Date("invalid")` → Invalid Date (no lanza error)
- `.getTime()` → `NaN`
- Debemos verificar explícitamente

#### Test 3: Performance

```javascript
it("/health should respond quickly (< 100ms)", async () => {
  const start = Date.now();
  await request(server).get("/health");
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100);
});
```

**Performance requirements como tests:**
- SLAs (Service Level Agreements) codificados
- Detecta regresiones de performance
- Documenta expectativas

#### Test 4: Manejo de errores

```javascript
it("should return 503 when MongoDB is not connected", async () => {
  await mongoose.connection.close();

  const res = await request(server).get("/ready");

  expect(res.status).toBe(503);
  expect(res.body.status).toBe("not ready");
  expect(res.body.checks.mongodb.status).toBe("unhealthy");

  // Cleanup: reconectar para otros tests
  await mongoose.connect(process.env.DB);
});
```

**Test de failure scenarios:**
- Más importante que happy path
- Producción siempre tiene problemas
- Tests deben verificar degradación graceful

### Coverage Metrics

**Current coverage: 73.87%**

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   73.87 |    46.92 |   59.42 |   75.59
routes/HealthRoute.js |   94.73 |       75 |     100 |   94.73
routes/GenresRoute.js |     100 |      100 |     100 |     100
routes/CustomersRoute |   41.17 |        0 |       0 |   45.16
```

**Métricas explicadas:**

- **Statements**: % de líneas ejecutadas
- **Branches**: % de if/else ejecutados (ambos caminos)
- **Functions**: % de funciones llamadas
- **Lines**: % de líneas ejecutadas (ignora llaves vacías)

**¿Por qué branch coverage es bajo (46.92%)?**
- No estamos probando todos los caminos de error
- Necesitamos tests para validaciones que fallan
- Ejemplo: `if (error)` → solo probamos success path

### Mejorando Coverage

**Prioridad 1: Rutas con < 50% coverage**
- CustomersRoute (41%)
- MoviesRoute (33%)
- RentalsRoute (31%)

**Patrón para integration tests:**

```javascript
describe("POST /api/customers", () => {
  describe("Validation", () => {
    it("should return 401 if not authenticated", async () => {
      // Test sin token
    });

    it("should return 400 if name is missing", async () => {
      // Test campo requerido
    });

    it("should return 400 if name is < 3 chars", async () => {
      // Test longitud mínima
    });
  });

  describe("Success cases", () => {
    it("should create customer if valid", async () => {
      // Test happy path
    });

    it("should return created customer with _id", async () => {
      // Test respuesta
    });
  });
});
```

**Este patrón cubre:**
- ✅ Authentication (401)
- ✅ Validation (400 con diferentes errores)
- ✅ Success (200/201)
- ✅ Branches (if statements de validación)

---

## Recursos de Aprendizaje

### CI/CD

**Tutoriales:**
- [GitHub Actions Quickstart](https://docs.github.com/en/actions/quickstart)
- [CI/CD Best Practices (Martin Fowler)](https://martinfowler.com/articles/continuousIntegration.html)

**Herramientas alternativas:**
- GitLab CI/CD
- CircleCI
- Jenkins
- Travis CI

### Health Checks

**Estándares:**
- [Health Check Response Format (RFC)](https://tools.ietf.org/id/draft-inadarei-api-health-check-01.html)
- [Kubernetes Health Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

**Patrones avanzados:**
- Circuit Breakers (evitan cascading failures)
- Graceful Shutdown (cierre limpio de conexiones)

### Swagger/OpenAPI

**Especificación:**
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - Editor online

**Code generation:**
- [OpenAPI Generator](https://openapi-generator.tech/) - Genera clientes en 40+ lenguajes
- [Swagger Codegen](https://swagger.io/tools/swagger-codegen/)

### Testing

**Libros:**
- "Working Effectively with Legacy Code" - Michael Feathers
- "Test Driven Development" - Kent Beck

**Frameworks:**
- Jest (nuestro stack)
- Mocha + Chai
- Vitest (alternativa moderna a Jest)

**Conceptos avanzados:**
- Test Doubles (Mocks, Stubs, Spies, Fakes)
- Property-based Testing (QuickCheck, fast-check)
- Mutation Testing (Stryker)

---

## Conclusión

La Fase 4 establece las bases para:

✅ **Deployment confiable** mediante CI/CD
✅ **Monitoreo efectivo** mediante Health Checks
✅ **Colaboración eficiente** mediante Swagger
✅ **Confianza en cambios** mediante Tests

**Próximos pasos recomendados:**

1. **Alcanzar 90% coverage** - Agregar tests para Customers, Movies, Rentals
2. **Monitoreo avanzado** - Integrar Prometheus/Grafana
3. **Performance testing** - Load testing con k6 o Artillery
4. **Security scanning** - SAST con SonarQube, DAST con OWASP ZAP

El camino hacia calidad es continuo. Cada mejora incremental compone.

---

**Última actualización:** Noviembre 2024
**Mantenedores:** Vidly API Team
**Feedback:** Abrir issue en GitHub
