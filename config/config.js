const dotenv = require("dotenv");
const Joi = require("joi");

// Load environment variables from .env in project root
// Works for all environments: development, production, and test
dotenv.config();

// Configuration schema validation
const envSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  // Server
  HOST: Joi.string().default("127.0.0.1"),
  PORT: Joi.number().port().default(3000),

  // Database
  DB: Joi.string().required(),

  // Authentication
  JWT_PRIVATE_KEY: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("1d"),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),

  // Rate Limiting
  RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  RATE_LIMIT_MAX: Joi.number().integer().positive().default(100),
  RATE_LIMIT_WINDOW: Joi.number().integer().positive().default(15),

  // CORS
  CORS_ORIGIN: Joi.string().default("http://localhost:3000"),
})
  .unknown(true); // Allow other env variables

// Validate environment variables
const { error, value: config } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const errors = error.details.map((detail) => detail.message).join(", ");
  throw new Error(`❌ Config validation error: ${errors}`);
}

module.exports = config;
