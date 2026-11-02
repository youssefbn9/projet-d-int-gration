'use strict';

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Tests d\'Authentification & Sécurité (server/tests/auth.test.js)', () => {
  const timestamp = Date.now();
  const validEmail = `admin.auth.${timestamp}@testpro.com`;
  const validPassword = 'Password123!';
  let authToken;

  afterAll(async () => {
    await pool.end();
  });

  // ── 1. Inscription OK ───────────────────────────────────────────────────────
  it('POST /api/auth/register : Inscription réussie et token renvoyé', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: `Boutique Auth ${timestamp}`,
        name: 'Gérant Auth',
        email: validEmail,
        password: validPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(validEmail);

    // Vérification de sécurité stricte : aucun hash de mot de passe ne fuite
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(JSON.stringify(res.body)).not.toContain('password_hash');

    authToken = res.body.data.token;
  });

  // ── 2. Inscription doublon (409) ───────────────────────────────────────────
  it('POST /api/auth/register : Refuse un email déjà utilisé (409)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Autre Boutique',
        name: 'Autre Gérant',
        email: validEmail,
        password: validPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('EMAIL_ALREADY_USED');
  });

  // ── 3. Mot de passe faible (422) ───────────────────────────────────────────
  it('POST /api/auth/register : Refuse un mot de passe faible (422)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Boutique Faible',
        name: 'User Faible',
        email: `faible.${timestamp}@test.com`,
        password: 'court', // Pas de majuscule, pas de chiffre, < 8 car.
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  // ── 4. Connexion OK ────────────────────────────────────────────────────────
  it('POST /api/auth/login : Connexion réussie avec bons identifiants', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validEmail,
        password: validPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(validEmail);
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });

  // ── 5. Connexion KO (mauvais mot de passe / inexistant) ─────────────────────
  it('POST /api/auth/login : Refuse un mot de passe incorrect (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validEmail,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login : Refuse un compte inexistant (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: `inexistant.${timestamp}@test.com`,
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  // ── 6. Routes protégées sans token (401) ───────────────────────────────────
  it('GET /api/auth/me : Refuse l\'accès sans jeton JWT (401 UNAUTHORIZED)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('GET /api/auth/me : Accès autorisé avec un jeton valide', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(validEmail);
  });
});
