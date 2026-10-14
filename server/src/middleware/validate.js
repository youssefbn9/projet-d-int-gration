'use strict';

/**
 * Fabrique un middleware de validation Zod pour body, query, ou params.
 * Peut être utilisé avec un schéma direct (par défaut req.body)
 * ou un objet { body?: schema, query?: schema, params?: schema }.
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  if (schema.body || schema.query || schema.params) {
    for (const key of ['body', 'query', 'params']) {
      if (schema[key]) {
        const result = schema[key].safeParse(req[key]);
        if (!result.success) {
          return next(result.error);
        }
        req[key] = result.data;
      }
    }
    return next();
  }

  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(result.error);
  }
  req[source] = result.data;
  return next();
};

module.exports = validate;
