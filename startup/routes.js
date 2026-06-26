const express = require("express");
const morgan = require("morgan");
const debug = require("debug")("Log");
const swaggerSpec = require("../config/swagger");

// Swagger UI loaded from a CDN and pointed at /api/openapi.json. swagger-ui-express's
// bundled static assets are not traced into the serverless function on Vercel, so the
// CDN approach is the reliable way to serve the interactive docs in production.
const SWAGGER_UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vidly API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui", deepLinking: true });
    };
  </script>
</body>
</html>`;

const genresRoute = require("../routes/GenresRoute");
const customersRoute = require("../routes/CustomersRoute");
const moviesRoute = require("../routes/MoviesRoute");
const rentalsRoute = require("../routes/RentalsRoute");
const usersRoute = require("../routes/UsersRoute");
const authRoute = require("../routes/AuthRoute");
const returnsRoute = require("../routes/ReturnsRoute");
const healthRoute = require("../routes/HealthRoute");
const errorHandler = require("../middleware/error");
const correlationId = require("../middleware/correlationId");
const requestLogger = require("../middleware/requestLogger");

module.exports = function (app) {
  app.set("view engine", "pug");
  app.set("views", "./views");

  // Health checks (must be first, before any middleware)
  app.use(healthRoute);

  // Interactive API documentation (Swagger UI) — served from a CDN (see SWAGGER_UI_HTML),
  // with a route-scoped CSP that allows the unpkg assets. Public demo API, docs are a showcase.
  app.get("/api-docs", (req, res) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https:; " +
        "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
        "script-src 'self' 'unsafe-inline' https://unpkg.com; connect-src 'self'"
    );
    res.type("html").send(SWAGGER_UI_HTML);
  });

  // OpenAPI Specification (JSON) - Available in all environments
  // Use this with external tools like Postman, Insomnia, or SwaggerHub
  app.get("/api/openapi.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Correlation ID for request tracing
  app.use(correlationId);

  // Request logging
  app.use(requestLogger);

  if (app.get("env") === "development") {
    app.use(morgan("tiny"));
    debug("Morgan enabled...");
  }

  app.use(express.json());

  // Routes
  app.use("/api/genres", genresRoute);
  app.use("/api/customers", customersRoute);
  app.use("/api/movies", moviesRoute);
  app.use("/api/rentals", rentalsRoute);
  app.use("/api/users", usersRoute);
  app.use("/api/auth", authRoute);
  app.use("/api/returns", returnsRoute);

  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
    res.render("index", { title: "Vidly Project", message: "Vidly Movies" });
  });

  // Error Handler
  app.use(errorHandler);
};
