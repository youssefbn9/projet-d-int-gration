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

  // Erreur MySQL doublon (ex: email, SKU, catégorie déjà utilisé)
  if (err.code === 'ER_DUP_ENTRY') {
    const msg = err.message || '';
    if (msg.includes('uq_product_sku') || msg.includes('sku')) {
      return res.status(409).json({
        success: false,
        error: 'SKU_ALREADY_EXISTS',
        code: 'SKU_ALREADY_EXISTS',
        message: 'Ce SKU existe déjà pour votre commerce',
      });
    }
    if (msg.includes('uq_cat_name')) {
      return res.status(409).json({
        success: false,
        error: 'CATEGORY_ALREADY_EXISTS',
        code: 'CATEGORY_ALREADY_EXISTS',
        message: 'Une catégorie avec ce nom existe déjà',
      });
    }
    return res.status(409).json({
      success: false,
      error: 'EMAIL_ALREADY_USED',
      code: 'EMAIL_ALREADY_USED',
      message: 'Cet email est déjà utilisé',
    });
  }

  // Erreur applicative contrôlée (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      code: err.code,
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
