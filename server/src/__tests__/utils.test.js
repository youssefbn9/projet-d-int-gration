'use strict';

const AppError = require('../utils/AppError');

describe('AppError', () => {
  it('crée une erreur avec statusCode et code', () => {
    const err = new AppError('Produit introuvable', 404, 'PRODUIT_INTROUVABLE');
    expect(err.message).toBe('Produit introuvable');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('PRODUIT_INTROUVABLE');
    expect(err instanceof Error).toBe(true);
  });
});

describe('errorHandler middleware', () => {
  const errorHandler = require('../middleware/errorHandler');
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('gère AppError correctement', () => {
    const err = new AppError('Accès refusé', 403, 'ACCES_REFUSE');
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'ACCES_REFUSE' })
    );
  });

  it('gère ZodError correctement', () => {
    const { z } = require('zod');
    let zodErr;
    try { z.object({ email: z.string().email() }).parse({ email: 'bad' }); }
    catch (e) { zodErr = e; }
    const res = mockRes();
    errorHandler(zodErr, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json.mock.calls[0][0].error).toBe('VALIDATION_ERROR');
  });

  it('renvoie 500 pour erreur inconnue', () => {
    const err = new Error('crash');
    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
