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

  logger.add(
    new logger.transports.File({
      level: "error",
      filename: "logExceptions.log",
      handleRejections: true,
    })
  );

  process.on("unhandledrejection", (ex) => {
    throw ex;
  });

  logger.add(
    new logger.transports.File({
      filename: "logFile.log",
    })
  );

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new logger.transports.Console({
        format: logger.format.combine(
          logger.format.colorize(),
          logger.format.simple()
        ),
      })
    );
  }

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
