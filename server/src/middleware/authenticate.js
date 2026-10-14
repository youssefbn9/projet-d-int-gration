'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Vérifie le JWT et injecte req.user = { userId, companyId, role }.
 */
const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentification requise', 401, 'NON_AUTHENTIFIE'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      companyId: payload.companyId,
      role: payload.role,
    };
    return next();
  } catch (err) {
    return next(err); // JsonWebTokenError ou TokenExpiredError → errorHandler
  }
};

module.exports = authenticate;
