'use strict';

const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

// Mock du pool DB pour isoler les tests
jest.mock('../config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
  end: jest.fn(),
}));

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  it('retourne 422 si email manquant', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'test' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('retourne 401 si utilisateur inexistant', async () => {
    pool.query.mockResolvedValueOnce([[]]); // findByEmail → aucun user
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@test.com', password: 'motdepasse123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('CREDENTIALS_INVALIDES');
  });

  it('retourne 422 si email invalide', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pas-un-email', password: 'test' });
    expect(res.status).toBe(422);
  });
});

describe('GET /health', () => {
  it('retourne 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Routes protégées', () => {
  it('GET /api/products retourne 401 sans token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('NON_AUTHENTIFIE');
  });

  it('GET /api/sales retourne 401 sans token', async () => {
    const res = await request(app).get('/api/sales');
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  // Fermer le pool si ouvert
  if (pool.end) await pool.end();
});
