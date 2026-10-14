'use strict';

const AppError = require('../utils/AppError');

/**
 * Gestionnaire d'erreurs global Express.
 * Toutes les erreurs passent par ici via next(err).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // Erreur Zod (validation)
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Données invalides',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_INVALIDE',
      message: 'Jeton d\'authentification invalide',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRE',
      message: 'Session expirée, veuillez vous reconnecter',
    });
  }

  // Erreur MySQL – doublon
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'DOUBLON',
      message: 'Une entrée avec ces données existe déjà',
    });
  }

  // Erreur applicative (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  // Erreur inconnue
  console.error('[ERREUR SERVEUR]', err);
  return res.status(500).json({
    success: false,
    error: 'ERREUR_SERVEUR',
    message: 'Une erreur interne est survenue',
  });
};

module.exports = errorHandler;
