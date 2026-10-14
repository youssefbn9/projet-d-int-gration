'use strict';

const AppError = require('../utils/AppError');

/**
 * Fabrique un middleware qui vérifie que req.user.role est dans les rôles autorisés.
 * @param {...string} roles - rôles autorisés (ex: 'admin', 'staff')
 */
const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Accès refusé : rôle insuffisant', 403, 'ACCES_REFUSE'));
    }
    return next();
  };

module.exports = requireRole;
