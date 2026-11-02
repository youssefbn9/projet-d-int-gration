'use strict';

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Tests Produits, Validation & Isolation Multi-Commerces (server/tests/products.test.js)', () => {
  let tokenCompanyA;
  let tokenCompanyB;
  let createdProductId;
  const timestamp = Date.now();
  const testSku = `SKU-PROD-${timestamp}`;

  beforeAll(async () => {
    // Inscription Commerce A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: `Entreprise Alpha Prod ${timestamp}`,
        name: 'Admin Alpha',
        email: `admin.alpha.prod.${timestamp}@test.com`,
        password: 'Password123!',
      });
    tokenCompanyA = resA.body.data.token;

    // Inscription Commerce B (pour tester l'étanchéité multi-tenant)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: `Entreprise Beta Prod ${timestamp}`,
        name: 'Admin Beta',
        email: `admin.beta.prod.${timestamp}@test.com`,
        password: 'Password123!',
      });
    tokenCompanyB = resB.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  // ── 1. Création Produit OK ──────────────────────────────────────────────────
  it('POST /api/products : Crée un produit avec succès (201)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        name: `Café Moulu Test ${timestamp}`,
        sku: testSku,
        price: 8.5,
        cost: 5.2,
        stock: 40,
        stockMin: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.sku).toBe(testSku);
    expect(res.body.data.stock_quantity).toBe(40);
    createdProductId = res.body.data.id;
  });

  // ── 2. SKU en doublon refusé (409) ──────────────────────────────────────────
  it('POST /api/products : Refuse un SKU déjà utilisé dans le même commerce (409)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        name: 'Autre Produit Même SKU',
        sku: testSku,
        price: 12.0,
        stock: 5,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('SKU_ALREADY_EXISTS');
  });

  // ── 3. Valeurs négatives refusées (422) ──────────────────────────────────────
  it('POST /api/products : Refuse un prix négatif ou stock négatif (422)', async () => {
    const resPrice = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        name: 'Produit Prix Négatif',
        sku: `SKU-NEG-${timestamp}`,
        price: -5.0,
        stock: 10,
      });
    expect(resPrice.status).toBe(422);

    const resStock = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        name: 'Produit Stock Négatif',
        sku: `SKU-STK-NEG-${timestamp}`,
        price: 10.0,
        stock: -1,
      });
    expect(resStock.status).toBe(422);
  });

  // ── 4. Pagination et Recherche ──────────────────────────────────────────────
  it('GET /api/products : Retourne la liste paginée et permet la recherche par SKU/nom', async () => {
    const res = await request(app)
      .get(`/api/products?page=1&limit=10&search=${testSku}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items[0].sku).toBe(testSku);

    expect(res.body.data).toHaveProperty('pagination');
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(10);
  });

  // ── 5. Lecture par ID & Mise à jour ─────────────────────────────────────────
  it('GET /api/products/:id & PUT /api/products/:id : Lecture et mise à jour OK', async () => {
    const resGet = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    expect(resGet.status).toBe(200);
    expect(resGet.body.data.name).toContain('Café Moulu Test');

    const resPut = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        name: `Café Moulu Modifié ${timestamp}`,
        sku: testSku,
        price: 9.9,
        cost: 6.0,
        stock: 35,
        stockMin: 12,
      });
    expect(resPut.status).toBe(200);
    expect(resPut.body.data.price).toBeCloseTo(9.9, 2);
  });

  // ── 6. Isolation Multi-Commerces Stricte (404) ──────────────────────────────
  it('Isolation : Le commerce B ne peut ni voir, ni modifier, ni supprimer le produit de A (404)', async () => {
    // Lecture
    const resGetOther = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`);
    expect(resGetOther.status).toBe(404);

    // Modification
    const resPutOther = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({
        name: 'Tentative Piratage',
        sku: testSku,
        price: 1.0,
      });
    expect(resPutOther.status).toBe(404);

    // Suppression
    const resDelOther = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`);
    expect(resDelOther.status).toBe(404);
  });

  // ── 7. Suppression du produit ───────────────────────────────────────────────
  it('DELETE /api/products/:id : Supprime le produit appartenant au commerce', async () => {
    const resDel = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);

    expect(resDel.status).toBe(200);

    // Vérifier qu'il est désormais introuvable
    const resCheck = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    expect(resCheck.status).toBe(404);
  });
});
