'use strict';


/**
 * Fabrique un middleware de validation Zod.
 * @param {import('zod').ZodSchema} schema - schéma Zod à valider contre req.body
 */
const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error); // ZodError → errorHandler
  }
  req.body = result.data; // remplace par les données validées/transformées
  return next();
};

module.exports = validate;
