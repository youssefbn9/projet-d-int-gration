'use strict';

const request = require('supertest');
const app = require('../app');
const pool = require('../config/db');

describe('PASSE 3/10: CRUD Métier Backend & Sécurité Multi-Tenant', () => {
  let tokenAlpha;
  let tokenGamma;
  let alphaUserId;

  beforeAll(async () => {
    // Connexion Alpha
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@alpha.com', password: 'Admin1234!' });
    tokenAlpha = resLogin.body.data.token;
    alphaUserId = resLogin.body.data.user.id;

    // Inscription Gamma (2ème commerce)
    const emailGamma = `admin.gamma.${Date.now()}@gamma.com`;
    const resReg = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Commerce Gamma',
        name: 'Gerant Gamma',
        email: emailGamma,
        password: 'Admin1234!',
      });
    tokenGamma = resReg.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  // ── 1. Catégories ─────────────────────────────────────────────────────────
  describe('Catégories (/api/categories)', () => {
    let catId;

    it('GET /api/categories retourne la liste des catégories Alpha', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/categories crée une nouvelle catégorie', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({ name: `Cat Alpha ${Date.now()}` });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBeDefined();
      catId = res.body.data.id;
    });

    it('POST /api/categories doublon renvoie 409 CATEGORY_ALREADY_EXISTS', async () => {
      const duplicateName = `Cat Uniq ${Date.now()}`;
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({ name: duplicateName });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({ name: duplicateName });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('CATEGORY_ALREADY_EXISTS');
    });

    it('PUT /api/categories/:id depuis un autre commerce (Gamma) renvoie 404', async () => {
      const res = await request(app)
        .put(`/api/categories/${catId}`)
        .set('Authorization', `Bearer ${tokenGamma}`)
        .send({ name: 'Hack Name' });
      expect(res.status).toBe(404);
    });

    it('DELETE /api/categories/:id avec produits liés renvoie 409 CATEGORY_HAS_PRODUCTS', async () => {
      // Catégorie 1 a des produits associés dans seed
      const res = await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('CATEGORY_HAS_PRODUCTS');
    });
  });

  // ── 2. Fournisseurs ───────────────────────────────────────────────────────
  describe('Fournisseurs (/api/suppliers)', () => {
    let supId;

    it('POST /api/suppliers crée un fournisseur', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          name: 'Tech Import TN',
          email: 'contact@techimport.tn',
          phone: '+216 71 888 999',
          address: 'Tunis',
        });
      expect(res.status).toBe(201);
      supId = res.body.data.id;
    });

    it('GET /api/suppliers/:id depuis un autre commerce renvoie 404', async () => {
      const res = await request(app)
        .get(`/api/suppliers/${supId}`)
        .set('Authorization', `Bearer ${tokenGamma}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/suppliers/:id lié à des produits renvoie 409 SUPPLIER_HAS_PRODUCTS', async () => {
      // Fournisseur 1 a des produits dans seed
      const res = await request(app)
        .delete('/api/suppliers/1')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('SUPPLIER_HAS_PRODUCTS');
    });
  });

  // ── 3. Clients ────────────────────────────────────────────────────────────
  describe('Clients (/api/customers)', () => {
    let custId;

    it('POST /api/customers crée un client', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          name: 'Société Client Test',
          email: 'client@test.tn',
          phone: '+216 71 123 456',
        });
      expect(res.status).toBe(201);
      custId = res.body.data.id;
    });

    it('GET /api/customers/:id depuis un autre commerce renvoie 404', async () => {
      const res = await request(app)
        .get(`/api/customers/${custId}`)
        .set('Authorization', `Bearer ${tokenGamma}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/customers/:id supprime un client libre', async () => {
      const res = await request(app)
        .delete(`/api/customers/${custId}`)
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── 4. Produits ───────────────────────────────────────────────────────────
  describe('Produits (/api/products)', () => {
    let createdProdId;
    const testSku = `SKU-TEST-${Date.now()}`;

    it('GET /api/products retourne data.items et data.pagination', async () => {
      const res = await request(app)
        .get('/api/products?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
    });

    it('GET /api/products avec filtre lowStock=true', async () => {
      const res = await request(app)
        .get('/api/products?lowStock=true')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.stock_quantity).toBeLessThanOrEqual(item.stock_min);
      }
    });

    it('POST /api/products avec stock > 0 crée le produit et son mouvement in initial', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          name: 'Produit Test Auto',
          sku: testSku,
          price: 99.99,
          cost: 50.00,
          stock: 15,
          min_stock: 5,
        });
      expect(res.status).toBe(201);
      createdProdId = res.body.data.id;
      expect(res.body.data.sku).toBe(testSku);
      expect(res.body.data.stock).toBe(15);
    });

    it('POST /api/products avec SKU doublon renvoie 409 SKU_ALREADY_EXISTS', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          name: 'Produit Doublon',
          sku: testSku,
          price: 10,
          stock: 1,
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('SKU_ALREADY_EXISTS');
    });

    it('POST /api/products avec categoryId hors commerce renvoie 422', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          name: 'Produit Cat Error',
          sku: `SKU-ERR-${Date.now()}`,
          price: 20,
          categoryId: 999999,
        });
      expect(res.status).toBe(422);
    });

    it('GET /api/products/:id depuis un autre commerce renvoie 404', async () => {
      const res = await request(app)
        .get(`/api/products/${createdProdId}`)
        .set('Authorization', `Bearer ${tokenGamma}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/products/:id lié à des ventes renvoie 409 PRODUCT_HAS_SALES', async () => {
      // Produit 1 est lié à la vente seed
      const res = await request(app)
        .delete('/api/products/1')
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('PRODUCT_HAS_SALES');
    });
  });

  // ── 5. Utilisateurs ───────────────────────────────────────────────────────
  describe('Utilisateurs (/api/users)', () => {
    let staffUserId;

    it('POST /api/users crée un collaborateur staff (admin requis)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          firstName: 'Kamel',
          lastName: 'Mansour',
          email: `kamel.${Date.now()}@alpha.com`,
          password: 'Password123!',
          role: 'staff',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('staff');
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.passwordHash).toBeUndefined();
      staffUserId = res.body.data.id;
    });

    it('PUT /api/users/:id empêche un utilisateur de modifier son propre rôle (400)', async () => {
      const res = await request(app)
        .put(`/api/users/${alphaUserId}`)
        .set('Authorization', `Bearer ${tokenAlpha}`)
        .send({
          firstName: 'Alice',
          lastName: 'Durand',
          role: 'staff',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('AUTO_ROLE_CHANGE');
    });

    it('DELETE /api/users/:id empêche un utilisateur de s\'auto-supprimer (400)', async () => {
      const res = await request(app)
        .delete(`/api/users/${alphaUserId}`)
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('AUTO_SUPPRESSION');
    });

    it('DELETE /api/users/:id depuis un autre commerce renvoie 404', async () => {
      const res = await request(app)
        .delete(`/api/users/${staffUserId}`)
        .set('Authorization', `Bearer ${tokenGamma}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/users/:id supprime le collaborateur libre', async () => {
      const res = await request(app)
        .delete(`/api/users/${staffUserId}`)
        .set('Authorization', `Bearer ${tokenAlpha}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
