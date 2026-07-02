const logger = require("winston");
require("winston-mongodb");
const config = require("../config/config");

module.exports = function () {
  // Logger
  logger.configure({
    level: "info",
    format: logger.format.combine(
      logger.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      logger.format.errors({ stack: true }),
      logger.format.splat(),
      logger.format.json(),
      logger.format.metadata()
    ),
  });

  // Handling Uncaught Exceptions
  logger.exceptions.handle(
    new logger.transports.Console({
      format: logger.format.combine(
        logger.format.colorize(),
        logger.format.simple()
      ),
    })
  );

  // In test environment, only use Console transport to avoid open file handles
  // File transports prevent Jest from exiting gracefully
  if (config.NODE_ENV === "test") {
    logger.add(
      new logger.transports.Console({
        format: logger.format.combine(
          logger.format.colorize(),
          logger.format.simple()
        ),
        silent: true, // Silence console output in tests
      })
    );
  } else if (process.env.VERCEL) {
    // Serverless (Vercel): solo Console. Vercel captura stdout/stderr.
    // NO usar File (el filesystem es de solo lectura) ni MongoDB (una segunda
    // conexión inestable cuyos timeouts provocan unhandledRejection y crashean
    // la función → 500 sin cabeceras CORS).
    logger.add(
      new logger.transports.Console({
        format: logger.format.combine(
          logger.format.colorize(),
          logger.format.simple()
        ),
      })
    );
  } else {
    // Production/Development local: File transports
    logger.add(
      new logger.transports.File({
        level: "error",
        filename: "logExceptions.log",
        handleRejections: true,
      })
    );

    logger.add(
      new logger.transports.File({
        filename: "logFile.log",
      })
    );

    if (config.NODE_ENV !== "production") {
      logger.add(
        new logger.transports.Console({
          format: logger.format.combine(
            logger.format.colorize(),
            logger.format.simple()
          ),
        })
      );
    }
  }

  process.on("unhandledrejection", (ex) => {
    throw ex;
  });

  // MongoDB logging - solo fuera de test y de serverless (en Vercel la segunda
  // conexión de winston-mongodb hace timeout intermitente y crashea la función).
  if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
    logger.add(
      new logger.transports.MongoDB({
        db: config.DB,
        options: {
          useUnifiedTopology: true,
        },
      })
    );
  }
};
