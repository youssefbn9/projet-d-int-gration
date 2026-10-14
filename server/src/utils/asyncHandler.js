'use strict';

/**
 * Enveloppe un handler asynchrone pour capturer automatiquement les rejets de promesse.
 * @param {Function} fn
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
