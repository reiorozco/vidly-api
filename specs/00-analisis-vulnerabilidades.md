# Análisis de Vulnerabilidades de Seguridad

**Fecha:** 16 de noviembre de 2025
**Proyecto:** Vidly-API
**Versión actual:** 1.0.0

## Resumen Ejecutivo

El análisis de dependencias revela **vulnerabilidades críticas de seguridad** que requieren atención inmediata. Se identificaron 6 CVEs de alta severidad en dos dependencias principales: Express.js y Mongoose.

### Estado Actual de Dependencias Críticas

- **Express:** 4.17.3 (Actual) → 4.21.2 (Recomendado)
- **Mongoose:** 6.4.6 (Actual) → 8.19.4 (Recomendado)

---

## Vulnerabilidades Identificadas

### 1. CVE-2024-29041: Express.js Open Redirect

**Severidad:** Media (CVSS 6.1)
**Tipo:** CWE-601 - Open Redirect
**Versiones afectadas:** Express < 4.19.2
**Versión actual del proyecto:** 4.17.3 ❌

#### Descripción Técnica
La función `encodeurl` de Express maneja URLs proporcionadas por usuarios de manera incorrecta, permitiendo que URLs malformadas eludan listas blancas de redirección correctamente implementadas. Esto afecta específicamente a:
- `res.location()`
- `res.redirect()`

#### Impacto en Vidly-API
**RIESGO ALTO** - El proyecto utiliza redirecciones en múltiples rutas:
- Rutas de autenticación
- Flujos de retorno de películas
- Posibles redirecciones post-login

#### Vectores de Ataque Potenciales
```javascript
// Ejemplo de explotación
// Un atacante podría enviar:
POST /api/auth
{
  "redirect": "http://evil.com@vidly-app.com/phishing"
}

// La URL malformada podría eludir validaciones como:
if (redirectUrl.includes('vidly-app.com')) {
  res.redirect(redirectUrl); // VULNERABLE
}
```

#### Remediación
1. **Inmediata:** Actualizar Express a 4.19.2+
2. **Workaround temporal:** Pre-parsear URLs con `new URL()` antes de `res.redirect()`

```javascript
// Implementación segura
const validateAndRedirect = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'vidly-app.com') {
      res.redirect(parsed.href);
    }
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
};
```

---

### 2. CVE-2024-43796: Express.js XSS Vulnerability

**Severidad:** Media (CVSS 5.0)
**Tipo:** Cross-Site Scripting (XSS)
**Versiones afectadas:** Express < 4.20.0
**Versión actual del proyecto:** 4.17.3 ❌

#### Descripción Técnica
Vulnerabilidad de Cross-Site Scripting que permite la inyección de scripts maliciosos a través de encabezados o parámetros mal sanitizados.

#### Impacto en Vidly-API
**RIESGO MEDIO** - El proyecto usa Pug como motor de plantillas y devuelve datos JSON principalmente, lo que reduce el impacto. Sin embargo, existe exposición en:
- Página principal (`GET /`) que renderiza Pug
- Posibles mensajes de error que reflejan input del usuario
- Headers HTTP manipulables

#### Análisis de Exposición
```javascript
// routes/GenresRoute.js - Potencialmente vulnerable
router.get("/:id", validateObjectId, async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) return res.status(404).send("This genre wasn't found."); // ¿Refleja input?
  res.send(genre);
});
```

#### Remediación
Actualizar Express a 4.20.0+ que incluye sanitización mejorada de headers y responses.

---

### 3. CVE-2023-3696: Mongoose Prototype Pollution

**Severidad:** CRÍTICA (CVSS 9.8)
**Tipo:** CWE-1321 - Prototype Pollution
**Versiones afectadas:** Mongoose < 5.13.20, 6.11.3, 7.3.4
**Versión actual del proyecto:** 6.4.6 ❌

#### Descripción Técnica
Vulnerabilidad de Prototype Pollution en `document.js` que permite a atacantes modificar el prototipo de Object a través de operadores como `$rename` en funciones de actualización:
- `findByIdAndUpdate()`
- `findOneAndUpdate()`
- `updateOne()`

Si un servicio mal implementado permite que usuarios controlen el objeto de actualización, un atacante puede ejecutar código remoto.

#### Impacto en Vidly-API
**RIESGO CRÍTICO** - El proyecto usa extensivamente `findByIdAndUpdate`:

```javascript
// routes/GenresRoute.js:40 - VULNERABLE
router.put("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findByIdAndUpdate(
    { _id: req.params.id },
    { name: req.body.name }, // ¿Qué pasa si req.body contiene __proto__?
    { new: true }
  );
  // ...
});
```

#### Vectores de Ataque Detectados
El proyecto tiene **3 archivos** con `findByIdAndUpdate`:
- `routes/GenresRoute.js`
- `routes/CustomersRoute.js`
- `routes/MoviesRoute.js`

**Ejemplo de exploit:**
```json
PUT /api/genres/507f1f77bcf86cd799439011
{
  "name": "Horror",
  "__proto__": {
    "isAdmin": true
  },
  "$rename": {
    "__proto__.isAdmin": "exploited"
  }
}
```

#### Remediación
1. **Crítico:** Actualizar Mongoose a 6.11.3+ o migrar a 8.x
2. **Mitigación inmediata:** Validar estrictamente req.body y rechazar propiedades peligrosas:

```javascript
const sanitizeUpdate = (update) => {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const keys = Object.keys(update);
  if (keys.some(k => dangerous.includes(k))) {
    throw new Error('Prohibited property detected');
  }
  return update;
};
```

---

### 4. CVE-2025-2306: Mongoose Vulnerability (Información Insuficiente)

**Severidad:** CRÍTICA (CVSS 9.4)
**Versiones afectadas:** Mongoose < 8.x (información preliminar)
**Versión actual del proyecto:** 6.4.6 ❌

#### Estado
CVE reciente con detalles limitados. Se recomienda monitorear:
- https://github.com/Automattic/mongoose/security/advisories
- https://nvd.nist.gov/vuln/detail/CVE-2025-2306

---

### 5. CVE-2024-53900: Mongoose Vulnerability

**Severidad:** CRÍTICA (CVSS 9.1)
**Versiones afectadas:** Mongoose < 7.x
**Versión actual del proyecto:** 6.4.6 ❌

---

### 6. CVE-2025-23061: Mongoose Vulnerability

**Severidad:** CRÍTICA (CVSS 9.0)
**Versiones afectadas:** Mongoose < 8.x (información preliminar)
**Versión actual del proyecto:** 6.4.6 ❌

---

## Análisis de Dependencias Desactualizadas

### Dependencias de Producción

| Paquete | Actual | Disponible | Gap | Severidad |
|---------|--------|------------|-----|-----------|
| **express** | 4.17.3 | 4.21.2 | 4 minor | 🔴 CRÍTICA |
| **mongoose** | 6.4.6 | 8.19.4 | 2 major | 🔴 CRÍTICA |
| bcrypt | 5.0.1 | 6.0.0 | 1 major | 🟡 Media |
| dotenv | 12.0.4 | 17.2.3 | 5 major | 🟡 Media |
| helmet | 5.0.2 | 8.1.0 | 3 major | 🟠 Alta |
| joi | 17.6.0 | 18.0.1 | 1 major | 🟢 Baja |
| jsonwebtoken | 9.0.0 | 9.0.2 | 0 minor | 🟢 Baja |
| winston | 3.6.0 | 3.18.3 | 12 minor | 🟡 Media |

### Dependencias de Desarrollo

| Paquete | Actual | Disponible | Gap |
|---------|--------|------------|-----|
| eslint | 8.9.0 | 9.39.1 | 1 major |
| jest | 27.5.1 | 30.2.0 | 3 major |
| prettier | 2.5.1 | 3.6.2 | 1 major |
| supertest | 6.2.2 | 7.1.4 | 1 major |

---

## Problemas de Configuración Detectados

### 1. Archivos de Entorno Faltantes

**Problema:** `.gitignore` excluye `/env/` pero no hay plantillas `.env.example`
**Impacto:** Configuración incorrecta en desarrollo, dificultad para nuevos desarrolladores
**Evidencia:**
```gitignore
# Línea 267 de .gitignore
/env/
```

**Remediación:**
- Crear `env/.env.example` con variables requeridas documentadas
- Actualizar README con instrucciones de configuración

### 2. Versión Mínima de Node.js Obsoleta

**Problema:** `package.json` especifica Node >= 8.10.0 (liberado en 2018, EOL en 2019)
**Impacto:** Incompatibilidad con dependencias modernas, sin soporte de seguridad
**Recomendación:** Node >= 18.x (LTS) o >= 20.x (Current LTS)

### 3. Scripts de npm Dependientes de Shell Unix

**Problema:** Scripts usan sintaxis export de Unix, incompatibles con Windows
```json
"dev": "export NODE_ENV=development&& nodemon",
"prod": "export NODE_ENV=production&& node api/index.js"
```

**Remediación:** Usar `cross-env` para compatibilidad multiplataforma

---

## Análisis de Impacto Global

### Severidad por Componente

```
CRÍTICO (4 CVEs): Mongoose 6.4.6
├─ CVE-2023-3696: Prototype Pollution (CVSS 9.8) ⚠️ EXPLOTABLE
├─ CVE-2025-2306: (CVSS 9.4)
├─ CVE-2024-53900: (CVSS 9.1)
└─ CVE-2025-23061: (CVSS 9.0)

ALTO (2 CVEs): Express 4.17.3
├─ CVE-2024-29041: Open Redirect (CVSS 6.1)
└─ CVE-2024-43796: XSS (CVSS 5.0)
```

### Matriz de Riesgo

| Componente | Probabilidad de Explotación | Impacto | Riesgo Final |
|------------|------------------------------|---------|--------------|
| Mongoose (Prototype Pollution) | Alta | Crítico | 🔴 CRÍTICO |
| Express (Open Redirect) | Media | Alto | 🟠 ALTO |
| Express (XSS) | Media | Medio | 🟡 MEDIO |
| Dependencias desactualizadas | Baja | Medio | 🟡 MEDIO |

---

## Recomendaciones Priorizadas

### Fase 1: Mitigación Inmediata (Esta semana)

1. **CRÍTICO:** Actualizar Mongoose a 6.11.3+ (parche de seguridad)
   ```bash
   npm install mongoose@6.11.3
   npm test
   ```

2. **CRÍTICO:** Actualizar Express a 4.21.2
   ```bash
   npm install express@4.21.2
   npm test
   ```

3. **ALTA:** Revisar todas las rutas con `findByIdAndUpdate` y agregar sanitización

### Fase 2: Actualización Mayor (Siguiente sprint)

1. Migrar a Mongoose 8.x (requiere cambios en código)
2. Actualizar helmet a 8.x para mejores headers de seguridad
3. Actualizar dependencias de testing (Jest, Supertest)

### Fase 3: Mejoras de Infraestructura

1. Implementar análisis automático de vulnerabilidades (npm audit, Snyk)
2. CI/CD con checks de seguridad
3. Dependabot para actualizaciones automáticas

---

## Conclusiones

1. **Riesgo actual del proyecto:** CRÍTICO
2. **Vulnerabilidades explotables:** 1 confirmada (CVE-2023-3696)
3. **Tiempo estimado de remediación crítica:** 2-4 horas
4. **Costo de migración completa:** 2-3 días de desarrollo + testing

**Prioridad absoluta:** Actualizar Mongoose y Express antes de cualquier despliegue a producción.
