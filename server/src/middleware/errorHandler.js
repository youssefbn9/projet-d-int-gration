'use strict';

const AppError = require('../utils/AppError');

/**
 * Gestionnaire d'erreurs global Express.
 * Format uniforme : { success: false, error: CODE, message: MSG, details?: [...] }
 * Aucun stack trace n'est renvoyé au client.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // Erreur de validation Zod
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Données invalides',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Jeton d\'authentification invalide',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Session expirée, veuillez vous reconnecter',
    });
  }

  // Erreur MySQL doublon (ex: email déjà utilisé)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'EMAIL_ALREADY_USED',
      message: 'Cet email est déjà utilisé',
    });
  }

  // Erreur applicative contrôlée (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  // Erreur inconnue / non gérée (500)
  console.error('[ERREUR_SERVEUR]', err.message || err);
  return res.status(500).json({
    success: false,
    error: 'ERREUR_SERVEUR',
    message: 'Une erreur interne est survenue',
  });
};

module.exports = errorHandler;
