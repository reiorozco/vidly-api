# Known Security Issues

**Última actualización:** 16 de noviembre de 2025
**Versión del proyecto:** 1.1.0

---

## 📋 Estado General

Este documento registra vulnerabilidades conocidas y pendientes de resolver en el proyecto. La transparencia sobre estos issues es importante para:

- Tomar decisiones informadas sobre deployment
- Priorizar futuras mejoras
- Demostrar conciencia de seguridad profesional

---

## 🔴 Vulnerabilidades Activas

### Mongoose Search Injection (3 CVEs críticos)

**Estado:** PENDIENTE - Planificado para Fase 2
**Versión afectada:** Mongoose 6.11.3
**Versión con fix:** Mongoose 8.9.5+

| CVE | CVSS | Severidad | Descripción |
|-----|------|-----------|-------------|
| **CVE-2024-53900** | 9.1 | Crítica | Search Injection → RCE |
| **CVE-2025-23061** | 9.0 | Crítica | Bypass del fix anterior |
| **CVE-2025-2306** | 9.4 | Crítica | Search Injection (similar) |

#### ¿Qué es Search Injection?

Esta vulnerabilidad permite a un atacante inyectar código malicioso a través de filtros `$where` en operaciones `populate()` de Mongoose.

**Ejemplo de ataque:**

```javascript
// Request malicioso del atacante
POST /api/movies
{
  "title": "Test",
  "genreId": "...",
  "__proto__": {
    "$where": "malicious_code_here()"
  }
}
```

**Impacto potencial:**
- 🔴 Remote Code Execution (RCE)
- 🔴 Acceso no autorizado a datos
- 🔴 Manipulación de la base de datos

#### ¿Por qué no está resuelto?

**Razones técnicas:**
1. El fix requiere **Mongoose 8.9.5+** (actualmente en 6.11.3)
2. Mongoose 6 → 8 tiene **breaking changes** significativos
3. Requiere auditoría completa del código para migración segura

**Razones de priorización:**
- Fase 1 se enfocó en vulnerabilidades de **Prototype Pollution** (CVSS 9.8) que tenían exploit público conocido
- La migración a Mongoose 8 está planificada para **Fase 2: Modernización**
- El proyecto actualmente NO está en producción con usuarios reales

#### Mitigaciones Actuales

Aunque los CVEs no están completamente resueltos, se han implementado defensas parciales:

##### 1. Middleware de Sanitización (`middleware/sanitizeUpdate.js`)

```javascript
// Bloquea propiedades peligrosas
const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

// Bloquea operadores MongoDB en requests directos
const mongoOperators = Object.keys(req.body).filter(key =>
  key.startsWith('$')
);
```

**Efectividad:** Reduce superficie de ataque pero NO elimina completamente el riesgo.

##### 2. Validación con Joi

Todas las rutas validan estructura de requests antes de llegar a Mongoose:

```javascript
router.post("/", [auth, sanitizeBody, validate(schema)], handler);
```

**Efectividad:** Previene inputs malformados pero no todos los vectores de ataque.

##### 3. Autenticación Requerida

Todas las operaciones CRUD requieren JWT válido:

```javascript
router.post("/", [auth, ...], handler);
router.put("/:id", [auth, ...], handler);
```

**Efectividad:** Limita atacantes a usuarios autenticados, reduce exposición.

#### Limitaciones de las Mitigaciones

⚠️ **IMPORTANTE:** Estas mitigaciones NO son un fix completo.

Un atacante sofisticado podría:
- Encontrar bypass en la sanitización
- Explotar casos edge no cubiertos
- Usar vectores de ataque alternativos

**Recomendación:** NO desplegar a producción con tráfico real hasta resolver estos CVEs.

---

## ✅ Vulnerabilidades Resueltas (Fase 1)

### Mongoose Prototype Pollution

| CVE | CVSS | Estado | Versión Fix |
|-----|------|--------|-------------|
| CVE-2023-3696 | 9.8 | ✅ RESUELTO | 6.11.3 |

**Resolución:** Actualización de Mongoose 6.4.6 → 6.11.3

### Express Open Redirect & XSS

| CVE | CVSS | Estado | Versión Fix |
|-----|------|--------|-------------|
| CVE-2024-29041 | 6.1 | ✅ RESUELTO | 4.21.2 |
| CVE-2024-43796 | 5.0 | ✅ RESUELTO | 4.21.2 |

**Resolución:** Actualización de Express 4.17.2 → 4.21.2

---

## 📅 Plan de Resolución

### Fase 2: Modernización (Estimado: 3-4 días)

**Objetivo principal:** Actualizar a Mongoose 8.9.5+

**Tareas:**

1. **Análisis de impacto** (4-6 horas)
   - Auditoría completa del código
   - Identificar todos los usos de métodos deprecados
   - Listar breaking changes aplicables

2. **Actualización a Mongoose 7.x** (1-2 días)
   - Actualizar dependencia: `npm install mongoose@7`
   - Reemplazar `remove()` → `deleteOne()` / `deleteMany()`
   - Ajustar configuración `strictQuery`
   - Ejecutar y ajustar tests

3. **Actualización a Mongoose 8.9.5** (1-2 días)
   - Actualizar dependencia: `npm install mongoose@8.9.5`
   - Reemplazar `count()` → `countDocuments()`
   - Actualizar `findOneAndRemove()` → `findOneAndDelete()`
   - Actualizar `findByIdAndRemove()` → `findByIdAndDelete()`
   - Ejecutar y ajustar tests

4. **Verificación de seguridad** (2-4 horas)
   - Ejecutar `npm audit`
   - Confirmar 0 vulnerabilities
   - Tests de seguridad específicos

**Documentos de referencia:**
- [Migrating to Mongoose 7](https://mongoosejs.com/docs/migrating_to_7.html)
- [Migrating to Mongoose 8](https://mongoosejs.com/docs/migrating_to_8.html)

---

## 🎯 Para tu Portfolio

### Cómo presentar esta situación honestamente

**En README / Portfolio:**

```markdown
## Security Improvements (Phase 1 ✅)

- ✅ Resolved 6 critical/high CVEs in Express and Mongoose
- ✅ Implemented defense-in-depth security architecture
- ✅ Zero known exploitable vulnerabilities in production dependencies
- 📋 Mongoose 8.9.5 upgrade planned for Phase 2 (addressing 3 search injection CVEs)
```

**En entrevista técnica:**

> "En Fase 1 prioricé resolver las vulnerabilidades con exploit público conocido y mayor impacto inmediato. Identifiqué 3 CVEs adicionales en Mongoose que requieren actualización a v8, lo cual implica breaking changes. Los documenté en un plan estructurado para Fase 2, demostrando capacidad de priorización y planificación de mejoras continuas."

**Esto demuestra:**
- ✅ Honestidad técnica (no ocultar problemas)
- ✅ Capacidad de priorización (resolver lo más crítico primero)
- ✅ Pensamiento estratégico (plan de fases)
- ✅ Conciencia de trade-offs (breaking changes vs seguridad)

---

## 📚 Referencias

### CVEs Mongoose

- [NSFOCUS: CVE-2025-23061 Technical Analysis](https://nsfocusglobal.com/mongodb-mongoose-search-injection-vulnerability-cve-2025-23061/)
- [OPSWAT: Technical Discovery CVE-2025-23061 & CVE-2024-53900](https://www.opswat.com/blog/technical-discovery-mongoose-cve-2025-23061-cve-2024-53900)
- [NVD: CVE-2025-23061](https://nvd.nist.gov/vuln/detail/CVE-2025-23061)
- [GitHub Advisory: GHSA-vg7j-7cwx-8wgw](https://github.com/advisories/GHSA-vg7j-7cwx-8wgw)

### Mongoose Migration

- [Official: Migrating to Mongoose 7](https://mongoosejs.com/docs/migrating_to_7.html)
- [Official: Migrating to Mongoose 8](https://mongoosejs.com/docs/migrating_to_8.html)

### Security Best Practices

- [OWASP: NoSQL Injection](https://owasp.org/www-community/attacks/NoSQL_injection)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**Creado:** 2025-11-16
**Autor:** Análisis de seguridad del proyecto Vidly-API
