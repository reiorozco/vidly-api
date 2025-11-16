# Plan de Mejoras Multifase - Vidly API

**Fecha de creación:** 16 de noviembre de 2025
**Última actualización:** 16 de noviembre de 2025
**Proyecto:** Vidly-API v1.0.0

---

## Visión General

Este documento presenta un plan estructurado en **4 fases** para modernizar, asegurar y mejorar la arquitectura de Vidly-API. El plan está diseñado para ser incremental, permitiendo despliegues continuos sin interrumpir el servicio.

### Objetivos Estratégicos

1. ✅ **Seguridad:** Eliminar todas las vulnerabilidades críticas y altas
2. 📦 **Modernización:** Actualizar dependencias a versiones LTS con soporte
3. 🏗️ **Arquitectura:** Mejorar escalabilidad y mantenibilidad
4. 🧪 **Calidad:** Aumentar cobertura de tests y automatización

---

## Resumen Ejecutivo de Fases

| Fase | Nombre | Duración | Esfuerzo | Riesgo | Prioridad |
|------|--------|----------|----------|--------|-----------|
| **1** | Seguridad Crítica | 1-2 días | 12-16h | Bajo | 🔴 CRÍTICA |
| **2** | Modernización de Dependencias | 3-4 días | 20-24h | Medio | 🟠 ALTA |
| **3** | Mejoras de Arquitectura | 5-7 días | 32-40h | Medio | 🟡 MEDIA |
| **4** | Calidad y DevOps | 3-5 días | 20-30h | Bajo | 🟢 BAJA |

**Duración total estimada:** 12-18 días laborables (2.5-3.5 semanas)

---

## Fase 1: Seguridad Crítica 🔒

**Objetivo:** Remediar vulnerabilidades críticas sin cambios disruptivos
**Duración:** 1-2 días
**Prerequisitos:** Ninguno
**Entregables:** Sistema seguro contra CVEs conocidas

### Tareas

#### 1.1 Actualización de Mongoose (Crítica)
- [ ] Actualizar de 6.4.6 → 6.11.3 (parche de seguridad)
- [ ] Ejecutar suite de tests completa
- [ ] Verificar que no hay breaking changes
- [ ] Documentar cambios en CHANGELOG

**Archivos afectados:**
- `package.json`
- `package-lock.json`

**Comando:**
```bash
npm install mongoose@6.11.3
npm test
```

**Riesgo:** BAJO (actualización de parche)

---

#### 1.2 Actualización de Express (Alta)
- [ ] Actualizar de 4.17.3 → 4.21.2
- [ ] Revisar deprecation warnings
- [ ] Ejecutar tests de integración
- [ ] Verificar comportamiento de redirects

**Comando:**
```bash
npm install express@4.21.2
npm test
```

**Riesgo:** BAJO (minor version dentro de 4.x)

---

#### 1.3 Sanitización de Inputs en Updates
- [ ] Implementar middleware `sanitizeUpdate`
- [ ] Aplicar a todas las rutas con `findByIdAndUpdate`
- [ ] Agregar tests unitarios para sanitización
- [ ] Documentar en CLAUDE.md

**Archivos a modificar:**
- `middleware/sanitizeUpdate.js` (nuevo)
- `routes/GenresRoute.js`
- `routes/CustomersRoute.js`
- `routes/MoviesRoute.js`

**Tests requeridos:**
- Rechazar `__proto__` en req.body
- Rechazar `constructor` en req.body
- Rechazar `prototype` en req.body

---

#### 1.4 Creación de Archivos de Entorno
- [ ] Crear `env/.env.example` con todas las variables
- [ ] Documentar variables en README.md
- [ ] Agregar validación de variables requeridas en startup/config.js

**Estructura de .env.example:**
```env
# Database
DB=mongodb://localhost:27017/vidly

# Authentication
JWT_PRIVATE_KEY=your-secret-key-here

# Server
HOST=127.0.0.1
PORT=3000
NODE_ENV=development
```

---

#### 1.5 Actualización de Helmet
- [ ] Actualizar helmet de 5.0.2 → 8.1.0
- [ ] Revisar configuración de Content Security Policy
- [ ] Habilitar HSTS en producción

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### Criterios de Aceptación Fase 1

✅ Todos los tests pasan
✅ No hay vulnerabilidades críticas en `npm audit`
✅ Aplicación funciona en desarrollo y producción
✅ Variables de entorno documentadas
✅ Headers de seguridad configurados correctamente

---

## Fase 2: Modernización de Dependencias 📦

**Objetivo:** Actualizar stack tecnológico a versiones LTS
**Duración:** 3-4 días
**Prerequisitos:** Fase 1 completada
**Entregables:** Dependencias modernas con soporte a largo plazo

### Tareas

#### 2.1 Migración a Mongoose 8.x (Breaking Changes)
- [ ] Estudiar guía de migración de Mongoose 8
- [ ] Actualizar a 8.19.4
- [ ] Adaptar código a cambios en API:
  - `Model.validate()` retorna copia del objeto
  - `findOneAndUpdate` usa `includeResultMetadata` en vez de `rawResult`
  - ObjectId constructor solo acepta strings de 24 caracteres
  - `strictQuery` es false por defecto
- [ ] Actualizar tipos TypeScript si se migra a TS
- [ ] Ejecutar tests de integración

**Cambios clave:**
```javascript
// ANTES (Mongoose 6)
const res = await Model.findOneAndUpdate(
  filter,
  update,
  { new: true, rawResult: true }
);

// DESPUÉS (Mongoose 8)
const res = await Model.findOneAndUpdate(
  filter,
  update,
  { new: true, includeResultMetadata: true }
);
```

**Archivos a revisar:**
- Todos los modelos en `/models`
- Todas las rutas que usan Mongoose queries
- Tests de integración

---

#### 2.2 Actualización de Node.js
- [ ] Actualizar versión mínima a Node 18.x LTS
- [ ] Modificar `package.json` engines
- [ ] Actualizar pipeline de CI/CD (si existe)
- [ ] Actualizar Dockerfile (si existe)

```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

---

#### 2.3 Actualización de Dependencias Menores
- [ ] bcrypt: 5.0.1 → 6.0.0
- [ ] dotenv: 12.0.4 → 17.2.3
- [ ] joi: 17.6.0 → 18.0.1
- [ ] winston: 3.6.0 → 3.18.3
- [ ] winston-mongodb: 5.0.7 → 7.0.1

**Proceso por dependencia:**
1. Actualizar en package.json
2. Leer CHANGELOG de la librería
3. Buscar breaking changes
4. Ejecutar tests
5. Resolver problemas

---

#### 2.4 Actualización de DevDependencies
- [ ] eslint: 8.9.0 → 9.39.1 (configurar flat config)
- [ ] jest: 27.5.1 → 30.2.0
- [ ] prettier: 2.5.1 → 3.6.2
- [ ] supertest: 6.2.2 → 7.1.4
- [ ] nodemon: 2.0.15 → 3.1.11

---

#### 2.5 Scripts Multiplataforma
- [ ] Instalar `cross-env`
- [ ] Actualizar scripts en package.json
- [ ] Probar en Windows, macOS y Linux

```json
"scripts": {
  "dev": "cross-env NODE_ENV=development nodemon",
  "prod": "cross-env NODE_ENV=production node api/index.js",
  "test": "cross-env NODE_ENV=test jest --watchAll --verbose"
}
```

---

### Criterios de Aceptación Fase 2

✅ Mongoose 8.x funcionando sin errores
✅ Node 18+ como versión mínima
✅ Todas las dependencias actualizadas
✅ Scripts funcionan en Windows y Unix
✅ Cobertura de tests >= 80%
✅ `npm audit` sin vulnerabilidades

---

## Fase 3: Mejoras de Arquitectura 🏗️

**Objetivo:** Refactorizar arquitectura para escalabilidad
**Duración:** 5-7 días
**Prerequisitos:** Fase 2 completada
**Entregables:** Código más mantenible y testeable

### Tareas

#### 3.1 Implementar Rate Limiting
- [ ] Instalar `express-rate-limit`
- [ ] Configurar límites por endpoint
- [ ] Implementar límites más estrictos para /auth
- [ ] Agregar tests

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth', authLimiter);
```

---

#### 3.2 Mejorar Validación con Joi
- [ ] Centralizar esquemas de validación
- [ ] Implementar validación de headers
- [ ] Agregar validación custom para ObjectId
- [ ] Mensajes de error personalizados en español

**Estructura propuesta:**
```
validators/
  ├── schemas/
  │   ├── genreSchema.js
  │   ├── userSchema.js
  │   └── movieSchema.js
  ├── customValidators.js
  └── index.js
```

---

#### 3.3 Implementar Paginación Estándar
- [ ] Crear middleware de paginación
- [ ] Aplicar a GET /genres, /movies, /customers
- [ ] Agregar headers `X-Total-Count`, `Link`
- [ ] Documentar en README

```javascript
// Respuesta estándar
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

---

#### 3.4 Logging Estructurado
- [ ] Configurar Winston con niveles apropiados
- [ ] Implementar correlation IDs
- [ ] Agregar logs de auditoría para operaciones críticas
- [ ] Integrar con servicio de logging externo (opcional)

```javascript
logger.info('User authenticated', {
  userId: user._id,
  email: user.email,
  correlationId: req.id,
  timestamp: new Date().toISOString()
});
```

---

#### 3.5 Refactorizar Manejo de Errores
- [ ] Crear clases de error personalizadas
- [ ] Implementar error handler centralizado mejorado
- [ ] Agregar códigos de error consistentes
- [ ] Documentar códigos de error

**Estructura:**
```
errors/
  ├── AppError.js (base class)
  ├── ValidationError.js
  ├── NotFoundError.js
  ├── UnauthorizedError.js
  └── errorCodes.js
```

---

#### 3.6 Separación de Configuración
- [ ] Crear módulo de configuración centralizado
- [ ] Implementar validación de config con Joi
- [ ] Soporte para múltiples entornos
- [ ] Documentar variables

```javascript
// config/index.js
module.exports = {
  server: {
    host: process.env.HOST,
    port: process.env.PORT
  },
  db: {
    uri: process.env.DB,
    options: { ... }
  },
  jwt: {
    secret: process.env.JWT_PRIVATE_KEY,
    expiresIn: '1d'
  }
};
```

---

### Criterios de Aceptación Fase 3

✅ Rate limiting activo en producción
✅ Validación completa y consistente
✅ Paginación implementada en todos los listados
✅ Logs estructurados y trazables
✅ Manejo de errores robusto
✅ Configuración validada y documentada

---

## Fase 4: Calidad y DevOps 🧪

**Objetivo:** Automatización y mejora continua
**Duración:** 3-5 días
**Prerequisitos:** Fase 3 completada
**Entregables:** Pipeline de CI/CD y calidad asegurada

### Tareas

#### 4.1 Aumentar Cobertura de Tests
- [ ] Objetivo: Cobertura >= 90%
- [ ] Agregar tests unitarios faltantes
- [ ] Agregar tests de integración para Returns
- [ ] Tests de seguridad (inyección, XSS, etc.)
- [ ] Tests de carga básicos

**Áreas sin cobertura actual:**
- Middleware de validación
- Error handlers
- Startup modules
- Edge cases en modelos

---

#### 4.2 Configurar GitHub Actions (CI/CD)
- [ ] Workflow para tests automáticos
- [ ] Workflow para security scanning
- [ ] Workflow para deployment a Vercel
- [ ] Badge de coverage en README

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm audit
```

---

#### 4.3 Implementar Pre-commit Hooks
- [ ] Instalar Husky
- [ ] Configurar lint-staged
- [ ] Hook para ESLint
- [ ] Hook para Prettier
- [ ] Hook para tests afectados

```json
"husky": {
  "hooks": {
    "pre-commit": "lint-staged",
    "pre-push": "npm test"
  }
},
"lint-staged": {
  "*.js": ["eslint --fix", "prettier --write"]
}
```

---

#### 4.4 Documentación API con Swagger
- [ ] Instalar swagger-ui-express
- [ ] Documentar todos los endpoints
- [ ] Agregar ejemplos de requests/responses
- [ ] Publicar en /api-docs

---

#### 4.5 Monitoreo y Observabilidad
- [ ] Implementar health checks (/health, /ready)
- [ ] Métricas con prom-client (opcional)
- [ ] Integración con Sentry para error tracking
- [ ] Dashboard de métricas

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

---

#### 4.6 Dependabot y Renovate
- [ ] Configurar Dependabot en GitHub
- [ ] Política de auto-merge para parches
- [ ] Notificaciones en Slack/Discord
- [ ] Revisión mensual de dependencias

---

### Criterios de Aceptación Fase 4

✅ Cobertura de tests >= 90%
✅ CI/CD pipeline funcionando
✅ Pre-commit hooks activos
✅ API documentada con Swagger
✅ Health checks implementados
✅ Dependabot configurado

---

## Métricas de Éxito

### KPIs por Fase

| Métrica | Baseline | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|---------|----------|--------|--------|--------|--------|
| CVEs Críticas | 4 | 0 | 0 | 0 | 0 |
| CVEs Altas | 2 | 0 | 0 | 0 | 0 |
| Cobertura Tests | ~60% | 60% | 70% | 80% | 90%+ |
| Dependencias Outdated | 18 | 16 | 0 | 0 | 0 |
| Technical Debt (horas) | ~80h | 60h | 30h | 10h | 5h |
| Tiempo de Build | N/A | N/A | <2min | <2min | <2min |

---

## Gestión de Riesgos

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Breaking changes en Mongoose 8 | Media | Alto | Tests exhaustivos, rollback plan |
| Incompatibilidad de dependencias | Baja | Medio | Actualizar una a la vez |
| Regresiones en producción | Baja | Alto | Deployment gradual, feature flags |
| Tiempo de migración mayor al estimado | Media | Medio | Buffer de tiempo, priorización |

### Plan de Rollback

Cada fase debe poder revertirse:
- **Fase 1:** `git revert` + `npm install` de package-lock previo
- **Fase 2:** Mantener branch de versión estable 6.x de Mongoose
- **Fase 3:** Feature flags para activar/desactivar funcionalidades
- **Fase 4:** Pipeline permite deployment de commits anteriores

---

## Estrategia de Deployment

### Approach: Blue-Green Deployment

1. **Blue (Actual):** Versión en producción
2. **Green (Nueva):** Versión con mejoras
3. **Testing:** Green recibe 10% del tráfico
4. **Validation:** Monitorear métricas por 24h
5. **Switch:** Si OK, cambiar 100% a Green
6. **Cleanup:** Desactivar Blue después de 48h

### Rollout por Fase

- **Fase 1:** Deploy directo (fixes de seguridad)
- **Fase 2:** Deploy gradual (10% → 50% → 100%)
- **Fase 3:** Deploy con feature flags
- **Fase 4:** Deploy continuo con CI/CD

---

## Recursos Necesarios

### Humanos
- 1 Backend Developer (full-time)
- 1 DevOps Engineer (part-time, Fase 4)
- 1 QA Tester (part-time)

### Infraestructura
- Entorno de staging equivalente a producción
- MongoDB instancia de pruebas
- CI/CD runners (GitHub Actions free tier)

### Herramientas
- GitHub (repositorio + CI/CD)
- Vercel (hosting)
- MongoDB Atlas (base de datos)
- Sentry (error tracking, opcional)

---

## Timeline Detallado

```
Semana 1
├─ Día 1-2: Fase 1 (Seguridad Crítica)
├─ Día 3: Testing y deployment Fase 1
├─ Día 4-5: Inicio Fase 2 (Mongoose 8 migration)

Semana 2
├─ Día 1-2: Continuar Fase 2 (dependencias)
├─ Día 3: Testing Fase 2
├─ Día 4-5: Inicio Fase 3 (Rate limiting, validación)

Semana 3
├─ Día 1-3: Continuar Fase 3 (arquitectura)
├─ Día 4: Testing Fase 3
├─ Día 5: Inicio Fase 4 (tests, CI/CD)

Semana 4 (opcional)
├─ Día 1-3: Continuar Fase 4
├─ Día 4: Testing final
├─ Día 5: Deployment a producción
```

---

## Checklist de Pre-inicio

Antes de comenzar Fase 1:

- [ ] Backup de base de datos de producción
- [ ] Crear branch `feature/security-updates`
- [ ] Configurar entorno de staging
- [ ] Notificar al equipo del plan
- [ ] Preparar documentos de rollback
- [ ] Configurar monitoreo de errores
- [ ] Congelar nuevas features durante migración

---

## Próximos Pasos

1. **Revisar este plan** con el equipo técnico
2. **Aprobar presupuesto** de tiempo y recursos
3. **Crear issues en GitHub** para tracking
4. **Iniciar Fase 1** con actualización de dependencias críticas
5. **Documentar progreso** en cada commit

---

## Documentos Relacionados

- [00-analisis-vulnerabilidades.md](./00-analisis-vulnerabilidades.md)
- [02-fase-1-seguridad.md](./02-fase-1-seguridad.md)
- [03-fase-2-modernizacion.md](./03-fase-2-modernizacion.md)
- [04-fase-3-mejoras-arquitectura.md](./04-fase-3-mejoras-arquitectura.md)
- [05-fase-4-calidad.md](./05-fase-4-calidad.md)

---

**Versión del documento:** 1.0
**Última revisión:** 2025-11-16
**Próxima revisión:** Después de cada fase completada
