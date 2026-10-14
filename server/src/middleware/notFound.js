'use strict';

const AppError = require('../utils/AppError');

/**
 * Middleware pour les routes non trouvées.
 */
const notFound = (req, _res, next) => {
  next(new AppError(`Route introuvable : ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

module.exports = notFound;
