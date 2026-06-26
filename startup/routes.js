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
  <link rel="icon" href="data:," />
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

// Landing page for the API root. Self-contained (inline styles, no external assets) so it
// stays within the production CSP and loads instantly.
const HOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Vidly API — a RESTful movie-rental API built with Node.js, Express and MongoDB. Interactive docs, live endpoints and a React client." />
<link rel="icon" href="data:," />
<title>Vidly API — RESTful movie-rental API</title>
<style>
  :root{
    --bg:#0b0e14; --surface:#141a24; --surface2:#1b2230; --border:#28313f;
    --ink:#e8edf4; --muted:#9aa6b6; --accent:#f4b350; --accent-ink:#1a1205;
  }
  *{box-sizing:border-box} html{-webkit-font-smoothing:antialiased}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    line-height:1.5}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:840px;margin:0 auto;padding:64px 24px 56px}
  .pill{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.02em;
    padding:3px 9px;border-radius:999px;background:rgba(244,179,80,.14);color:var(--accent);
    border:1px solid rgba(244,179,80,.3)}
  h1{font-size:clamp(2.2rem,6vw,3.2rem);line-height:1.05;margin:18px 0 10px;letter-spacing:-.02em}
  h1 .ac{color:var(--accent)}
  .lede{color:var(--muted);font-size:1.075rem;max-width:60ch;margin:0}
  .cta{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0 8px}
  .btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;padding:11px 18px;
    border-radius:12px;border:1px solid var(--border);transition:transform .15s ease,border-color .15s ease,background .15s ease}
  .btn:hover{transform:translateY(-2px)}
  .btn.primary{background:var(--accent);color:var(--accent-ink);border-color:transparent}
  .btn.ghost:hover{border-color:var(--accent);color:var(--accent)}
  .sec{margin-top:40px}
  .sec h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);
    font-weight:600;margin:0 0 14px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
  .card{display:block;background:var(--surface);border:1px solid var(--border);border-radius:14px;
    padding:16px;transition:transform .15s ease,border-color .15s ease}
  .card:hover{transform:translateY(-3px);border-color:var(--accent)}
  .card .k{font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--accent)}
  .card .t{font-weight:600;margin:6px 0 3px}
  .card .p{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--muted);
    word-break:break-all}
  .panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px 20px}
  .row{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-top:1px solid var(--border)}
  .row:first-child{border-top:0} .row .lbl{color:var(--muted)}
  .row .val{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;text-align:right;word-break:break-all}
  pre{background:#0a0d13;border:1px solid var(--border);border-radius:12px;padding:14px 16px;overflow-x:auto;
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--ink);margin:12px 0 0}
  pre .c{color:var(--accent)}
  footer{margin-top:44px;padding-top:20px;border-top:1px solid var(--border);color:var(--muted);
    font-size:14px;display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:space-between}
  footer a:hover{color:var(--accent)}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<main class="wrap">
  <span class="pill">v2.1.0 · REST · OpenAPI 3.0</span>
  <h1>🎬 Vidly <span class="ac">API</span></h1>
  <p class="lede">A RESTful movie-rental API built with Node.js, Express &amp; MongoDB — JWT auth,
    role-based access, Joi validation, Jest tests and CI. Browse it below.</p>

  <div class="cta">
    <a class="btn primary" href="/api-docs">Open Swagger UI →</a>
    <a class="btn ghost" href="https://github.com/reiorozco/vidly-api">View source on GitHub ↗</a>
  </div>

  <section class="sec">
    <h2>Explore</h2>
    <div class="grid">
      <a class="card" href="/api-docs"><div class="k">DOCS</div><div class="t">Swagger UI</div><div class="p">/api-docs</div></a>
      <a class="card" href="/api/openapi.json"><div class="k">SPEC</div><div class="t">OpenAPI (JSON)</div><div class="p">/api/openapi.json</div></a>
      <a class="card" href="/api/movies"><div class="k">GET · LIVE</div><div class="t">Movies</div><div class="p">/api/movies</div></a>
      <a class="card" href="/api/genres"><div class="k">GET · LIVE</div><div class="t">Genres</div><div class="p">/api/genres</div></a>
      <a class="card" href="/health"><div class="k">STATUS</div><div class="t">Health check</div><div class="p">/health</div></a>
      <a class="card" href="https://vidly-app-six.vercel.app"><div class="k">CLIENT ↗</div><div class="t">React web app</div><div class="p">vidly-app-six.vercel.app</div></a>
    </div>
  </section>

  <section class="sec">
    <h2>Quick start</h2>
    <div class="panel">
      <div class="row"><span class="lbl">Base URL</span><span class="val">https://vidly-api.vercel.app/api</span></div>
      <div class="row"><span class="lbl">Auth header</span><span class="val">x-auth-token: &lt;jwt&gt;</span></div>
      <div class="row"><span class="lbl">Format</span><span class="val">application/json</span></div>
      <pre><span class="c">curl</span> https://vidly-api.vercel.app/api/movies</pre>
    </div>
  </section>

  <footer>
    <span>Built by <a href="https://github.com/reiorozco">Reinaldo Orozco</a> · Node · Express · MongoDB · Jest</span>
    <span><a href="https://github.com/reiorozco/vidly-api">GitHub</a> · MIT</span>
  </footer>
</main>
</body>
</html>`;

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
    res.setHeader("Cache-Control", "s-max-age=60, stale-while-revalidate");
    res.type("html").send(HOME_HTML);
  });

  // Error Handler
  app.use(errorHandler);
};
