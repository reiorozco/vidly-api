# Vidly API

> RESTful API for a movie rental service built with Node.js, Express, and MongoDB

[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/reiorozco/vidly-api)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Mongoose](https://img.shields.io/badge/mongoose-8.9.5-green.svg)](https://mongoosejs.com)
[![Security](https://img.shields.io/badge/vulnerabilities-0-success.svg)](https://github.com/reiorozco/vidly-api)
[![Coverage](https://img.shields.io/badge/coverage-73.87%25-yellow.svg)](https://github.com/reiorozco/vidly-api)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

Vidly API is a comprehensive RESTful API demonstrating professional Node.js development practices including authentication, authorization, data validation, error handling, security best practices, and test-driven development.

**Key Features:**
- ✅ **100% Secure** - 0 known vulnerabilities, 6 critical CVEs resolved
- ✅ **Modern Stack** - Node.js 18+, Mongoose 8, Express 4.21
- ✅ **Defense in Depth** - 7 layers of security validation
- ✅ **Well Tested** - 73.87% test coverage with Jest
- ✅ **Production Ready** - Deployed on Vercel with MongoDB Atlas
- ✅ **CI/CD Pipeline** - Automated testing and deployment via GitHub Actions
- ✅ **Health Checks** - Liveness and readiness endpoints for monitoring
- ✅ **API Documentation** - Interactive Swagger/OpenAPI docs

## 🚀 Demo

- **API**: Deployed on Vercel
- **Client**: [Vidly App](https://vidly-app-six.vercel.app)
- **Client Repo**: [reiorozco/Vidly-APP](https://github.com/reiorozco/Vidly-APP)

## 📋 Requirements

- **Node.js**: >= 18.0.0 (LTS recommended)
- **npm**: >= 9.0.0
- **MongoDB**: 4.4+ (MongoDB Atlas recommended)

Check your versions:
```bash
node --version  # Should output v18.x or v20.x
npm --version   # Should output 9.x or higher
```

## 🛠️ Tech Stack

### Core
- **Runtime**: Node.js 18+
- **Framework**: Express 4.21.2
- **Database**: MongoDB + Mongoose 8.9.5
- **Authentication**: JWT (jsonwebtoken 9.0.0)
- **Validation**: Joi 17.5.0

### Security
- **Helmet** 8.1.0 - Security headers (CSP, HSTS, etc.)
- **bcrypt** 5.0.1 - Password hashing
- **CORS** 2.8.5 - Cross-origin resource sharing
- **Custom Middleware** - Input sanitization, prototype pollution protection

### Development
- **Testing**: Jest 27.5.1 + Supertest 6.2.2
- **Logging**: Winston 3.6.0 + Winston-MongoDB 5.0.7
- **Code Quality**: ESLint + Prettier

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/reiorozco/vidly-api.git
cd vidly-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
```

**Required environment variables:**
```env
# Database
DB=mongodb://localhost:27017/vidly
# Or MongoDB Atlas:
# DB=mongodb+srv://username:password@cluster.mongodb.net/vidly

# JWT Secret (REQUIRED - minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_PRIVATE_KEY=your-secret-key-minimum-32-characters-long-replace-this
JWT_EXPIRES_IN=1d

# Environment
NODE_ENV=development

# Server
HOST=127.0.0.1
PORT=3000

# Logging
LOG_LEVEL=debug
DEBUG=Log

# Rate Limiting (disable for development)
RATE_LIMIT_ENABLED=false

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 4. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# With debugging
npm run debug
```

The API will be available at `http://localhost:3000`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests without coverage
npm test -- --no-coverage

# Run specific test file
npx jest tests/integration/genres.test.js

# Run tests in CI environment
npm run test:ci
```

## 🔐 Security

This project implements **defense in depth** with multiple security layers:

1. **HTTP Security Headers** (Helmet)
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options, X-Content-Type-Options

2. **CORS** - Whitelist of allowed origins

3. **Authentication** - JWT token verification

4. **Authorization** - Role-based access control

5. **Input Sanitization** - Prototype pollution & MongoDB injection protection

6. **Schema Validation** - Joi validation for request bodies

7. **Mongoose Schema** - Database-level validation

**Security Status:**
- ✅ 0 vulnerabilities (npm audit --production)
- ✅ 6 critical CVEs resolved
- ✅ Mongoose 8.9.5 (latest patches)
- ✅ All dependencies up-to-date

See [docs/SECURITY-UPDATES.md](docs/SECURITY-UPDATES.md) for detailed security documentation.

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require authentication via JWT token in header:
```
x-auth-token: <your-jwt-token>
```

### API Documentation

Interactive API documentation is available via Swagger UI:
```
http://localhost:3000/api-docs
```

### Health Checks

Monitor application health with built-in endpoints:

| Endpoint | Type | Description | Response Time |
|----------|------|-------------|---------------|
| `/health` | Liveness | Basic health check | 3-5ms |
| `/ready` | Readiness | Database connectivity check | 90-150ms |

**Example:**
```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":123,"timestamp":"2025-11-16T..."}

curl http://localhost:3000/ready
# {"status":"ready","database":"connected","timestamp":"2025-11-16T..."}
```

### Endpoints

#### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth` | Login user | No |
| POST | `/api/users` | Register user | No |
| GET | `/api/users/me` | Get current user | Yes |

#### Genres
| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/genres` | Get all genres | No | No |
| GET | `/api/genres/:id` | Get genre by ID | No | No |
| POST | `/api/genres` | Create genre | Yes | No |
| PUT | `/api/genres/:id` | Update genre | Yes | No |
| DELETE | `/api/genres/:id` | Delete genre | Yes | Yes |

#### Movies
| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/movies` | Get all movies | No | No |
| GET | `/api/movies/:id` | Get movie by ID | No | No |
| POST | `/api/movies` | Create movie | Yes | No |
| PUT | `/api/movies/:id` | Update movie | Yes | No |
| DELETE | `/api/movies/:id` | Delete movie | Yes | Yes |

#### Customers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/customers` | Get all customers | Yes |
| GET | `/api/customers/:id` | Get customer by ID | Yes |
| POST | `/api/customers` | Create customer | Yes |
| PUT | `/api/customers/:id` | Update customer | Yes |
| DELETE | `/api/customers/:id` | Delete customer | Yes |

#### Rentals
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/rentals` | Get all rentals | Yes |
| GET | `/api/rentals/:id` | Get rental by ID | Yes |
| POST | `/api/rentals` | Create rental | Yes |

#### Returns
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/returns` | Process return | Yes |

### Example Requests

**Register User:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Create Genre (requires auth):**
```bash
curl -X POST http://localhost:3000/api/genres \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN" \
  -d '{"name": "Action"}'
```

## 🏗️ Project Structure

```
vidly-api/
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD pipeline
├── api/
│   └── index.js              # Application entry point
├── config/
│   └── config.js             # Configuration loader
├── docs/
│   ├── SECURITY-UPDATES.md   # Security documentation
│   ├── KNOWN-ISSUES.md       # CVE tracking
│   ├── FASE-1-RESUMEN.md     # Phase 1 summary
│   ├── FASE-3-ARQUITECTURA.md # Architecture improvements
│   └── FASE-4-QUALITY-DEVOPS.md # Quality & DevOps guide
├── middleware/
│   ├── admin.js              # Admin authorization
│   ├── auth.js               # JWT authentication
│   ├── error.js              # Global error handler
│   ├── sanitizeBody.js       # Body sanitization
│   ├── sanitizeUpdate.js     # Update sanitization
│   ├── validate.js           # Joi validation wrapper
│   └── validateObjectId.js   # MongoDB ObjectId validation
├── models/
│   ├── CustomerModel.js
│   ├── GenreModel.js
│   ├── MovieModel.js
│   ├── RentalModel.js
│   └── UserModel.js
├── routes/
│   ├── AuthRoute.js
│   ├── CustomersRoute.js
│   ├── GenresRoute.js
│   ├── HealthRoute.js        # Health check endpoints
│   ├── MoviesRoute.js
│   ├── RentalsRoute.js
│   ├── ReturnsRoute.js
│   ├── SwaggerRoute.js       # Swagger documentation
│   └── UsersRoute.js
├── startup/
│   ├── config.js             # Config validation
│   ├── db.js                 # MongoDB connection
│   ├── logging.js            # Winston setup
│   ├── prod.js               # Production middleware
│   ├── routes.js             # Route registration
│   └── validation.js         # Joi configuration
├── tests/
│   ├── integration/          # API integration tests
│   └── unit/                 # Unit tests
├── specs/                    # Technical specifications
├── .env.example              # Environment template
├── .env                      # Environment variables (not in git)
├── CHANGELOG.md              # Version history
└── package.json
```

## 📖 Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
- [docs/SECURITY-UPDATES.md](docs/SECURITY-UPDATES.md) - Security improvements guide
- [docs/FASE-4-QUALITY-DEVOPS.md](docs/FASE-4-QUALITY-DEVOPS.md) - Quality & DevOps guide
- [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) - CVE tracking (all resolved)
- [specs/](specs/) - Technical specifications and improvement plans
- Swagger API Docs: http://localhost:3000/api-docs (when running)

## 🔄 Version History

### v2.2.0 (2025-11-16) - Phase 4 Complete ✨
- ✅ **CI/CD Pipeline** - GitHub Actions with automated testing
- ✅ **Health Checks** - Liveness (/health) and Readiness (/ready) endpoints
- ✅ **Swagger Docs** - Interactive API documentation at /api-docs
- ✅ **Test Coverage** - Improved to 73.87% (target: 90%)
- ✅ **New Tests** - Health endpoints, sanitization middleware
- ✅ **Environment Setup** - Standard .env configuration

### v2.1.0 (2025-11-16) - Phase 3 Complete
- ✅ Enhanced architecture with body sanitization
- ✅ Improved error handling and validation
- ✅ Code organization improvements

### v2.0.0 (2025-11-16) - Phase 2 Complete
- ✅ Upgraded Mongoose 6 → 8.9.5
- ✅ Resolved 3 critical CVEs (CVSS 9+)
- ✅ Updated Node.js requirement to 18+
- ✅ 0 production vulnerabilities

### v1.1.0 (2025-11-16) - Phase 1 Complete
- ✅ Resolved 3 critical CVEs
- ✅ Implemented input sanitization
- ✅ Enhanced security headers (Helmet 8)
- ✅ 52% code reduction

See [CHANGELOG.md](CHANGELOG.md) for full history.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Commit Convention:** This project uses [Conventional Commits](https://www.conventionalcommits.org/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built following best practices from Node.js community
- Security practices from OWASP Top 10
- Mongoose migration guides
- Express.js security best practices

## 📧 Contact

Reinaldo Orozco - [@reiorozco](https://github.com/reiorozco)

Project Link: [https://github.com/reiorozco/vidly-api](https://github.com/reiorozco/vidly-api)

---

**Built with ❤️ using Node.js, Express, and MongoDB**
