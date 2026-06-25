const express = require("express");
const app = express();
const config = require("../config/config");
const logger = require("winston");

// Detrás del proxy de Vercel: confiar en X-Forwarded-* para obtener la IP real
// del cliente y que express-rate-limit identifique correctamente a los usuarios.
if (process.env.VERCEL) {
  app.set("trust proxy", 1);
}

if (config.NODE_ENV === "production") {
  require("../startup/prod")(app);
}
require("../startup/logging")();
require("../startup/routes")(app);
require("../startup/db")();
require("../startup/config")();
require("../startup/validation")();

// En Vercel (serverless) NO se hace app.listen(): Vercel provee el servidor y
// espera que se exporte el handler de Express. Llamar app.listen() ahí intenta
// bindear un puerto inexistente y la función termina de forma anormal (status 0).
// En test y desarrollo local se mantiene el servidor (supertest necesita .close()).
let exported;
if (process.env.VERCEL) {
  exported = app;
} else {
  exported = app.listen(process.env.PORT, process.env.HOST, () =>
    logger.info(
      `NODE_ENV=${process.env.NODE_ENV}\nApp listening on http://${process.env.HOST}:${process.env.PORT}`
    )
  );
}

module.exports = exported;
