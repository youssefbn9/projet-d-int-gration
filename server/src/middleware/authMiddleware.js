'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Vérifie le header Authorization: Bearer et injecte req.user = { userId, companyId, role }.
 */
const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentification requise', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = {
      userId: payload.userId,
      companyId: payload.companyId,
      role: payload.role,
    };
    return next();
  } catch (_err) {
    return next(new AppError('Jeton invalide ou expiré', 401, 'UNAUTHORIZED'));
  }
};

module.exports = authMiddleware;
