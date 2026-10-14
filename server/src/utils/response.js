'use strict';

/**
 * Envoie une réponse formatée de succès.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {number} statusCode
 * @param {string} [message]
 */
const success = (res, data = null, statusCode = 200, message = null) => {
  const payload = { success: true };
  if (data !== null) payload.data = data;
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
};

/**
 * Envoie une réponse formatée d'erreur.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {string} errorCode
 * @param {*} [details]
 */
const error = (
  res,
  message = 'Une erreur est survenue',
  statusCode = 500,
  errorCode = 'ERREUR_SERVEUR',
  details = null
) => {
  const payload = {
    success: false,
    error: errorCode,
    message,
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
};

module.exports = {
  success,
  error,
};
