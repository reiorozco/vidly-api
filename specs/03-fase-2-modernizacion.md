# Fase 2: Modernización de Dependencias 📦

**Estado:** ⏳ Pendiente (Requiere Fase 1 completada)
**Prioridad:** 🟠 ALTA
**Duración estimada:** 3-4 días (20-24 horas)
**Prerequisitos:** Fase 1 completada y desplegada
**Responsable:** Backend Developer

---

## Objetivos

Actualizar el stack tecnológico a versiones modernas con soporte a largo plazo (LTS), incluyendo la migración mayor de Mongoose 6.x a 8.x y actualización de Node.js.

### Resultados Esperados

✅ Mongoose 8.19.4 funcionando sin breaking changes
✅ Node.js 18+ como versión mínima
✅ Todas las dependencias en versiones actuales
✅ Scripts multiplataforma (Windows/Linux/macOS)
✅ `npm audit` sin vulnerabilidades
✅ Cobertura de tests >= 80%

---

## Tarea 2.1: Migración a Mongoose 8.x

**Tiempo estimado:** 8-10 horas
**Riesgo:** MEDIO-ALTO
**Complejidad:** Alta (Breaking Changes)

### Breaking Changes de Mongoose 6 → 8

#### 1. `findOneAndUpdate` - Cambio de opciones

```javascript
// ANTES (Mongoose 6)
const result = await Model.findOneAndUpdate(
  filter,
  update,
  { new: true, rawResult: true }
);

// DESPUÉS (Mongoose 8)
const result = await Model.findOneAndUpdate(
  filter,
  update,
  { new: true, includeResultMetadata: true }
);
```

**Archivos a actualizar:**
- Buscar todas las ocurrencias de `rawResult` y reemplazar

#### 2. `Model.validate()` retorna copia

```javascript
// En Mongoose 8, validate() no modifica el objeto original
const obj = { name: 'test' };
const validated = Model.validate(obj);
// obj permanece sin cambios
```

**Impacto:** Bajo - No usamos Model.validate() directamente en el código actual

#### 3. `strictQuery` false por defecto

```javascript
// Mongoose 8 no filtra campos desconocidos en queries por defecto
// Para mantener comportamiento de Mongoose 6:
mongoose.set('strictQuery', true);
```

**Implementar en startup/db.js:**
```javascript
const mongoose = require("mongoose");
const logger = require("winston");
const config = require("../config/config");

module.exports = function () {
  // Mantener comportamiento de Mongoose 6
  mongoose.set('strictQuery', true);

  const db = config.DB;
  mongoose.connect(db).then(() => logger.info(`Connected to MongoDB...`));
};
```

#### 4. ObjectId constructor más estricto

```javascript
// Mongoose 8 solo acepta strings de 24 caracteres para ObjectId
// Antes aceptaba 12 caracteres
new mongoose.Types.ObjectId('12charstring'); // ❌ Error en Mongoose 8
new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // ✅ OK
```

**Verificar en middleware/validateObjectId.js**

### Plan de Migración

#### Paso 1: Preparación (1h)

```bash
# Crear branch específico
git checkout -b feature/mongoose-8-migration

# Backup de package.json y lock
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup
```

#### Paso 2: Actualización (1h)

```bash
# Actualizar Mongoose
npm install mongoose@8.19.4 --save

# Verificar dependencias rotas
npm ls
```

#### Paso 3: Adaptación de Código (4-6h)

**startup/db.js:**
```javascript
const mongoose = require("mongoose");
const logger = require("winston");
const config = require("../config/config");

module.exports = function () {
  // Configuración de Mongoose 8
  mongoose.set('strictQuery', true);
  mongoose.set('strict', true);

  // Opciones de conexión (Mongoose 8 deprecó algunas)
  const options = {
    // Mongoose 8 maneja automáticamente la mayoría de opciones
  };

  const db = config.DB;

  mongoose.connect(db, options)
    .then(() => {
      logger.info(`Connected to MongoDB (Mongoose ${mongoose.version})`);
    })
    .catch((err) => {
      logger.error('MongoDB connection error:', err);
      process.exit(1);
    });

  // Event listeners para debugging
  if (config.NODE_ENV === 'development') {
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  }
};
```

**Buscar y reemplazar `rawResult`:**
```bash
grep -r "rawResult" routes/
# Actualizar manualmente cada ocurrencia
```

#### Paso 4: Testing Exhaustivo (2-3h)

```bash
# Tests unitarios
npm test -- --testPathPattern=unit

# Tests de integración
npm test -- --testPathPattern=integration

# Tests específicos de modelos
npm test -- --testPathPattern=models

# Test de conexión a MongoDB
npm test -- --testPathPattern=db
```

**Crear tests específicos para Mongoose 8:**

```javascript
// tests/integration/mongoose8.test.js
const mongoose = require('mongoose');
const { Genre } = require('../../models/GenreModel');

describe('Mongoose 8 Compatibility', () => {
  beforeEach(() => {
    server = require('../../api');
  });

  afterEach(async () => {
    await Genre.deleteMany({});
    await server.close();
  });

  it('should work with findOneAndUpdate', async () => {
    const genre = new Genre({ name: 'Action' });
    await genre.save();

    const result = await Genre.findOneAndUpdate(
      { _id: genre._id },
      { name: 'Updated Action' },
      { new: true }
    );

    expect(result.name).toBe('Updated Action');
  });

  it('should respect strictQuery setting', async () => {
    await Genre.create({ name: 'Drama' });

    // Campo no definido en schema
    const results = await Genre.find({ unknownField: 'value' });

    // Con strictQuery: true, debería ignorar unknownField
    expect(results.length).toBe(0);
  });

  it('should validate ObjectId strings correctly', () => {
    // 24 caracteres - válido
    expect(() => {
      new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    }).not.toThrow();

    // 12 caracteres - inválido en Mongoose 8
    expect(() => {
      new mongoose.Types.ObjectId('12charstring');
    }).toThrow();
  });
});
```

### Criterios de Aceptación Tarea 2.1

- [ ] Mongoose 8.19.4 instalado
- [ ] `strictQuery` configurado apropiadamente
- [ ] Todos los `rawResult` reemplazados
- [ ] Todos los tests pasan
- [ ] No hay deprecation warnings
- [ ] Documentación actualizada (CLAUDE.md)

---

## Tarea 2.2: Actualización de Node.js

**Tiempo estimado:** 2 horas
**Riesgo:** BAJO

### Actualizar package.json

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Actualizar README.md

```markdown
## Requirements

- Node.js 18.x or higher (LTS recommended)
- MongoDB 4.4 or higher
- npm 9.x or higher

### Checking Your Version

\`\`\`bash
node --version  # Should output v18.x.x or higher
npm --version   # Should output 9.x.x or higher
\`\`\`
```

### Actualizar CI/CD (si existe)

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

### Testing con Múltiples Versiones

```bash
# Usando nvm (Node Version Manager)
nvm install 18
nvm use 18
npm test

nvm install 20
nvm use 20
npm test
```

---

## Tarea 2.3: Actualizar Dependencias de Producción

**Tiempo estimado:** 4-5 horas
**Riesgo:** MEDIO

### Plan de Actualización por Dependencia

#### 2.3.1 bcrypt: 5.0.1 → 6.0.0

```bash
npm install bcrypt@6.0.0 --save
npm test -- --testPathPattern=auth
```

**Testing específico:**
- Login de usuarios
- Registro de usuarios
- Comparación de passwords

#### 2.3.2 dotenv: 12.0.4 → 17.2.3

```bash
npm install dotenv@17.2.3 --save
```

**Cambios:** Ningún breaking change esperado
**Testing:** Verificar carga de variables de entorno

#### 2.3.3 joi: 17.6.0 → 18.0.1

```bash
npm install joi@18.0.1 --save
```

**Revisar:** Posibles cambios en validación
**Testing:** Tests de validación en todos los modelos

#### 2.3.4 winston: 3.6.0 → 3.18.3

```bash
npm install winston@3.18.3 --save
npm install winston-mongodb@7.0.1 --save
```

**Testing:**
- Verificar logs en consola
- Verificar logs en archivos
- Verificar logs en MongoDB

#### 2.3.5 Otras dependencias menores

```bash
npm install compression@1.8.1 --save
npm install cors@2.8.5 --save
npm install debug@4.4.3 --save
npm install morgan@1.10.1 --save
npm install pug@3.0.3 --save
```

### Checklist de Actualización

Para cada dependencia:
- [ ] Leer CHANGELOG
- [ ] Identificar breaking changes
- [ ] Actualizar código si es necesario
- [ ] Ejecutar tests
- [ ] Verificar funcionamiento en dev
- [ ] Documentar cambios

---

## Tarea 2.4: Actualizar DevDependencies

**Tiempo estimado:** 3-4 horas
**Riesgo:** BAJO

### ESLint 8.9.0 → 9.39.1 (Breaking: Flat Config)

ESLint 9 usa un nuevo formato de configuración.

**Migrar .eslintrc.json a eslint.config.js:**

```javascript
// eslint.config.js (nuevo formato)
const nodePlugin = require('eslint-plugin-node');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly'
      }
    },
    plugins: {
      node: nodePlugin
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'node/no-unsupported-features/es-syntax': 'off'
    }
  },
  prettierConfig
];
```

```bash
npm install eslint@9.39.1 --save-dev
npm install eslint-config-prettier@10.1.8 --save-dev
npx eslint .
```

### Jest 27.5.1 → 30.2.0

```bash
npm install jest@30.2.0 --save-dev
```

**Actualizar jest.config.js (si existe) o package.json:**

```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      "/tests/"
    ],
    "collectCoverageFrom": [
      "**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**"
    ]
  }
}
```

### Prettier 2.5.1 → 3.6.2

```bash
npm install prettier@3.6.2 --save-dev
```

**Actualizar .prettierrc:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Supertest 6.2.2 → 7.1.4

```bash
npm install supertest@7.1.4 --save-dev
```

### Nodemon 2.0.15 → 3.1.11

```bash
npm install nodemon@3.1.11 --save-dev
```

---

## Tarea 2.5: Scripts Multiplataforma

**Tiempo estimado:** 1 hora
**Riesgo:** BAJO

### Instalar cross-env

```bash
npm install cross-env --save-dev
```

### Actualizar scripts en package.json

```json
{
  "scripts": {
    "start": "node api/index.js",
    "dev": "cross-env NODE_ENV=development nodemon",
    "prod": "cross-env NODE_ENV=production node api/index.js",
    "debug": "cross-env DEBUG=Log node api/index.js",
    "test": "cross-env NODE_ENV=test jest --watchAll --verbose --detectOpenHandles --coverage",
    "test:ci": "cross-env NODE_ENV=test jest --ci --coverage --maxWorkers=2",
    "test:unit": "cross-env NODE_ENV=test jest --testPathPattern=unit",
    "test:integration": "cross-env NODE_ENV=test jest --testPathPattern=integration",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.js\"",
    "format:check": "prettier --check \"**/*.js\""
  }
}
```

### Testing en Windows

```powershell
# PowerShell
npm run dev
npm test
npm run lint
```

---

## Checklist General Fase 2

### Pre-implementación
- [ ] Fase 1 completada y en producción
- [ ] Branch `feature/phase-2-modernization` creado
- [ ] Backup de package files

### Implementación
- [ ] Tarea 2.1: Mongoose 8.x migrado
- [ ] Tarea 2.2: Node.js 18+ requerido
- [ ] Tarea 2.3: Deps de producción actualizadas
- [ ] Tarea 2.4: DevDeps actualizadas
- [ ] Tarea 2.5: Scripts multiplataforma

### Testing
- [ ] Tests unitarios pasan (100%)
- [ ] Tests de integración pasan (100%)
- [ ] Cobertura >= 80%
- [ ] Testing en Windows OK
- [ ] Testing en Linux OK
- [ ] Testing en macOS OK (opcional)

### Quality Checks
- [ ] `npm audit` sin vulnerabilidades
- [ ] `npm outdated` solo minor/patch updates
- [ ] ESLint pasa sin errores
- [ ] Prettier formateado aplicado
- [ ] No deprecation warnings

### Documentación
- [ ] CLAUDE.md actualizado con Mongoose 8
- [ ] README.md actualizado
- [ ] CHANGELOG.md actualizado
- [ ] Migration guide creado (docs/MONGOOSE_8_MIGRATION.md)

---

## Métricas de Éxito

| Métrica | Baseline | Target | Actual |
|---------|----------|--------|--------|
| Mongoose Version | 6.4.6 | 8.19.4 | - |
| Node.js Min Version | 8.10 | 18.0 | - |
| Dependencias Outdated | 18 | 0 | - |
| npm audit vulnerabilities | 6 | 0 | - |
| Test Coverage | 60% | 80% | - |
| Compatible Platforms | Unix | All | - |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Breaking changes en Mongoose 8 | Tests exhaustivos, documentación de MongoDB oficial |
| Incompatibilidad de dependencias | Actualizar una a la vez, verificar peerDependencies |
| Regresiones en tests | Aumentar cobertura antes de migrar |
| Tiempo mayor al estimado | Priorizar Mongoose y Node.js, resto en Fase 3 |

---

## Próximos Pasos Post-Fase 2

1. ✅ Tag release `v2.0.0` (major por Mongoose 8)
2. 📊 Reporte de mejoras de performance
3. 🚀 Iniciar Fase 3: Mejoras de Arquitectura
4. 📚 Documentar lecciones aprendidas

---

**Última actualización:** 2025-11-16
**Estado:** Listo para iniciar después de Fase 1
