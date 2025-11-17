/**
 * Swagger/OpenAPI Configuration
 *
 * Provides interactive API documentation accessible at /api-docs
 * Auto-generates documentation from JSDoc comments in route files
 */

const swaggerJsdoc = require("swagger-jsdoc");
const config = require("./config");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vidly API",
      version: "2.1.0",
      description:
        "RESTful API for movie rental service with comprehensive security and best practices",
      contact: {
        name: "API Support",
        url: "https://github.com/yourusername/vidly-api",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url: `http://${config.HOST}:${config.PORT}`,
        description: "Development server",
      },
      {
        url: "https://vidly-api-production.herokuapp.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "apiKey",
          name: "x-auth-token",
          in: "header",
          description: "JWT token for authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR",
                },
                message: {
                  type: "string",
                  example: "Invalid request data",
                },
                correlationId: {
                  type: "string",
                  example: "550e8400-e29b-41d4-a716-446655440000",
                },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            totalPages: {
              type: "integer",
              example: 5,
            },
            totalItems: {
              type: "integer",
              example: 50,
            },
            hasNext: {
              type: "boolean",
              example: true,
            },
            hasPrev: {
              type: "boolean",
              example: false,
            },
          },
        },
        Genre: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "Action",
              minLength: 3,
              maxLength: 50,
            },
          },
          required: ["name"],
        },
        Customer: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "John Doe",
              minLength: 3,
              maxLength: 255,
            },
            phone: {
              type: "string",
              example: "555-1234",
              minLength: 3,
              maxLength: 255,
            },
            isGold: {
              type: "boolean",
              example: false,
              default: false,
            },
          },
          required: ["name", "phone"],
        },
        Movie: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            title: {
              type: "string",
              example: "The Matrix",
              minLength: 3,
              maxLength: 255,
            },
            genre: {
              type: "object",
              properties: {
                _id: {
                  type: "string",
                  example: "507f1f77bcf86cd799439012",
                },
                name: {
                  type: "string",
                  example: "Sci-Fi",
                },
              },
            },
            numberInStock: {
              type: "integer",
              example: 10,
              minimum: 0,
              maximum: 255,
            },
            dailyRentalRate: {
              type: "number",
              example: 4.99,
              minimum: 0,
              maximum: 255,
            },
          },
          required: ["title", "genre", "numberInStock", "dailyRentalRate"],
        },
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            name: {
              type: "string",
              example: "John Doe",
              minLength: 3,
              maxLength: 255,
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            isAdmin: {
              type: "boolean",
              example: false,
              default: false,
            },
          },
          required: ["name", "email", "password"],
        },
        Rental: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            customer: {
              type: "object",
              properties: {
                _id: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                phone: {
                  type: "string",
                },
              },
            },
            movie: {
              type: "object",
              properties: {
                _id: {
                  type: "string",
                },
                title: {
                  type: "string",
                },
                dailyRentalRate: {
                  type: "number",
                },
              },
            },
            dateOut: {
              type: "string",
              format: "date-time",
              example: "2024-01-15T10:00:00.000Z",
            },
            dateReturned: {
              type: "string",
              format: "date-time",
              example: "2024-01-20T10:00:00.000Z",
            },
            rentalFee: {
              type: "number",
              example: 24.95,
            },
          },
          required: ["customerId", "movieId"],
        },
      },
      responses: {
        Unauthorized: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        Forbidden: {
          description: "User does not have permission to access this resource",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFound: {
          description: "The requested resource was not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ValidationError: {
          description: "Invalid request data",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints for monitoring",
      },
      {
        name: "Authentication",
        description: "User authentication endpoints",
      },
      {
        name: "Users",
        description: "User registration and management",
      },
      {
        name: "Genres",
        description: "Movie genre management",
      },
      {
        name: "Customers",
        description: "Customer management",
      },
      {
        name: "Movies",
        description: "Movie inventory management",
      },
      {
        name: "Rentals",
        description: "Rental transaction management",
      },
      {
        name: "Returns",
        description: "Movie return processing",
      },
    ],
  },
  // Path to the API routes files
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
