'use strict';

/**
 * Classe d'erreur applicative avec code HTTP et code métier.
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
