require("express-async-errors");
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
  } else {
    // Production/Development: Use File transports
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

  // MongoDB logging - Skip in test environment to avoid connection issues
  if (process.env.NODE_ENV !== "test") {
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
