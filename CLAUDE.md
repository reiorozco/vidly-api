# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vidly-API is a RESTful API built with Node.js, Express, and MongoDB for a movie rental service. The project demonstrates professional API development patterns including authentication, authorization, validation, error handling, logging, and comprehensive testing.

## Development Commands

### Running the Application
- `npm start` - Start the production server (runs `api/index.js`)
- `npm run dev` - Start development server with nodemon (auto-reload on changes)
- `npm run prod` - Start in production mode with NODE_ENV=production
- `npm run debug` - Start with debug logging enabled (DEBUG=Log)

### Testing
- `npm test` - Run Jest tests in watch mode with verbose output and coverage
- Run specific test: `npx jest <test-file-path>` (e.g., `npx jest tests/integration/genres.test.js`)
- Run single test suite: `npx jest <test-file-path> -t "test description"`

### Code Quality
- ESLint is configured but not included in npm scripts - run manually with `npx eslint .`
- Prettier is available for formatting - run with `npx prettier --write .`

## Architecture

### Application Initialization Flow (api/index.js)
The application bootstraps in a specific order:
1. **Production middleware** (startup/prod.js) - Only in production: helmet, compression, CORS
2. **Logging** (startup/logging.js) - Winston configuration, exception/rejection handlers
3. **Routes** (startup/routes.js) - Express middleware and API routes
4. **Database** (startup/db.js) - MongoDB connection via Mongoose
5. **Config validation** (startup/config.js) - Ensures JWT_PRIVATE_KEY is set
6. **Validation** (startup/validation.js) - Joi validation setup

### Directory Structure
```
api/            - Application entry point (index.js)
config/         - Configuration management (loads from env/<NODE_ENV>.env)
docs/           - Project documentation and security guides
env/            - Environment configuration files (.env.example)
middleware/     - Express middleware (auth, admin, error, validate, validateObjectId, sanitizeUpdate)
models/         - Mongoose models (Customer, Genre, Movie, Rental, User)
routes/         - Express route handlers (Auth, Customers, Genres, Movies, Rentals, Returns, Users)
specs/          - Technical specifications and improvement plans
startup/        - Application bootstrap modules
tests/
  ├── integration/ - API integration tests using supertest
  └── unit/       - Unit tests for models and middleware
views/          - Pug templates
public/         - Static files
```

### Security Architecture (Phase 1 - v1.1.0)

The project implements **defense-in-depth** security with multiple validation layers:

#### Security Layers (Order of Execution)
1. **Helmet** (startup/prod.js) - HTTP security headers
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options, X-Content-Type-Options
   - Cross-Origin policies

2. **CORS** (startup/prod.js) - Cross-Origin Resource Sharing
   - Whitelist of allowed origins
   - Credentials support for JWT
   - Configured methods and headers

3. **Authentication** (middleware/auth.js)
   - JWT token verification via x-auth-token header
   - Token payload validation

4. **Authorization** (middleware/admin.js)
   - Role-based access control
   - Admin-only routes protection

5. **Input Sanitization** (middleware/sanitizeUpdate.js) - NEW in v1.1.0
   - Prototype Pollution protection
   - Blocks dangerous properties (__proto__, constructor, prototype)
   - Prevents MongoDB operator injection ($set, $inc, etc.)
   - Recursive validation for nested objects

6. **Schema Validation** (Joi)
   - Request body structure validation
   - Type checking and constraints

7. **Mongoose Schema**
   - Final layer of type validation
   - Database constraints

#### Middleware Usage Pattern

```javascript
// Creation (POST)
router.post("/", [auth, sanitizeBody, validate(schema)], handler);

// Update (PUT/PATCH)
router.put("/:id", [auth, validateObjectId, sanitizeUpdate, validate(schema)], handler);

// Deletion (DELETE)
router.delete("/:id", [auth, admin, validateObjectId], handler);
```

#### Security Documentation

- **docs/SECURITY-UPDATES.md**: Comprehensive security guide (educational)
  - CVE analysis and remediation
  - Attack vectors explained with examples
  - Implementation details
  - Learning resources

- **middleware/sanitizeUpdate.js**: Heavily documented middleware
  - Inline explanations of security concepts
  - Usage examples
  - Edge cases covered

#### Security Best Practices Applied

- ✅ Zero known vulnerabilities (npm audit clean)
- ✅ Defense in depth (6 validation layers)
- ✅ Mongoose 6.11.3 (patches CVE-2023-3696 - Prototype Pollution)
- ✅ Express 4.21.2 (patches CVE-2024-29041, CVE-2024-43796)
- ✅ Helmet 8.1.0 with comprehensive CSP configuration
- ✅ CORS whitelist (no wildcard *)
- ✅ JWT with secure signing
- ✅ Environment variables for sensitive data
- ✅ HTTPS enforcement in production (HSTS)

### Environment Configuration
Environment variables are loaded from `env/<NODE_ENV>.env` files:
- `env/development.env` - Development settings
- `env/production.env` - Production settings
- `env/test.env` - Test settings (used by Jest)

Required environment variables:
- `JWT_PRIVATE_KEY` - Secret key for JWT signing (critical - app won't start without it)
- `DB` - MongoDB connection string
- `HOST` - Server host (default: 127.0.0.1)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment name (development/production/test)

### Authentication & Authorization
- **Authentication**: JWT tokens via `x-auth-token` header (middleware/auth.js)
- **Authorization**: Admin role check (middleware/admin.js)
- **Token generation**: User model instance method `generateAuthToken()`
- Token payload includes: `_id`, `name`, `email`, `isAdmin`

### API Routes
All routes prefixed with `/api`:
- `/api/genres` - Movie genres CRUD
- `/api/customers` - Customer management
- `/api/movies` - Movie inventory
- `/api/rentals` - Rental transactions
- `/api/returns` - Return processing
- `/api/users` - User registration
- `/api/auth` - User login/authentication

### Middleware Chain Pattern
Routes use middleware arrays for protection:
```javascript
router.post("/", auth, async (req, res) => { ... });           // Authenticated users only
router.delete("/:id", [auth, admin], async (req, res) => { ... }); // Admins only
router.get("/:id", validateObjectId, async (req, res) => { ... }); // ObjectId validation
```

### Error Handling
- `express-async-errors` package eliminates need for try/catch in async routes
- Global error handler in middleware/error.js logs to Winston and returns 500
- Winston logs to: file (logFile.log), file for errors (logExceptions.log), MongoDB, console (non-production)

### Data Validation
- Request validation: Joi schemas in model files (validate functions)
- MongoDB ObjectId validation: validateObjectId middleware
- Schema validation happens before database operations

### Testing Strategy
**Integration tests** (supertest):
- Start a real server with `require("../../api")`
- Test full HTTP request/response cycle
- Clean up database and close server in `afterEach`

**Unit tests**:
- Focused on models and middleware
- Test business logic in isolation

## Important Notes

- The app uses CommonJS modules (`require`/`module.exports`), not ES6 imports
- Node version requirement: >=8.10.0 (see package.json engines)
- Database cleanup in tests uses `Genre.deleteMany({})` pattern
- Server must be closed in test cleanup to avoid open handles
- Production CORS allows specific Vercel deployment URLs
- Password hashing uses bcrypt (implemented in User model/auth routes)
- Mongoose queries use async/await pattern throughout
