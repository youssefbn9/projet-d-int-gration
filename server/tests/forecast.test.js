'use strict';

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('PASSE 5/10: Module de Prévision ML et API REST', () => {
  let tokenDemo;
  let otherToken;
  let demoProductId;

  beforeAll(async () => {
    // Connexion avec le compte seed
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@demo.tn', password: 'Admin123' });

    tokenDemo = resLogin.body.data.token;

    // Inscription d'un 2ème commerce pour tester l'étanchéité multi-tenant
    const resOther = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: `Autre Commerce ${Date.now()}`,
        name: 'Gérant Autre',
        email: `autre.${Date.now()}@test.com`,
        password: 'Password123!',
      });
    otherToken = resOther.body.data.token;

    // Récupérer un produit du commerce démo
    const resProd = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${tokenDemo}`);
    demoProductId = resProd.body.data.items[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/forecast/products/:id renvoie la prévision 7 jours et l\'historique 30 jours', async () => {
    const res = await request(app)
      .get(`/api/forecast/products/${demoProductId}`)
      .set('Authorization', `Bearer ${tokenDemo}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    expect(data).toHaveProperty('product');
    expect(data.product.id).toBe(demoProductId);
    expect(data.product).toHaveProperty('name');
    expect(data.product).toHaveProperty('stock');

    expect(data).toHaveProperty('history');
    expect(data.history).toHaveLength(30);

    expect(data).toHaveProperty('forecast');
    expect(data.forecast).toHaveLength(7);

    // Vérifier que chaque prévision est non négative
    data.forecast.forEach((f) => {
      expect(f.quantity).toBeGreaterThanOrEqual(0);
      expect(f).toHaveProperty('date');
    });

    expect(data).toHaveProperty('model');
    expect(data.model).toHaveProperty('slope');
    expect(data.model).toHaveProperty('intercept');
    expect(data.model).toHaveProperty('r2');

    expect(data).toHaveProperty('avgForecastPerDay');
    expect(data).toHaveProperty('daysBeforeStockout');
    expect(data).toHaveProperty('alert');
  });

  it('GET /api/forecast/products/:id renvoie 404 PRODUCT_NOT_FOUND pour un commerce tiers ou inexistant', async () => {
    // Tentative par l'autre commerce
    const resOther = await request(app)
      .get(`/api/forecast/products/${demoProductId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(resOther.status).toBe(404);
    expect(resOther.body.error).toBe('PRODUCT_NOT_FOUND');

    // ID inexistant
    const resMissing = await request(app)
      .get('/api/forecast/products/99999999')
      .set('Authorization', `Bearer ${tokenDemo}`);
    expect(resMissing.status).toBe(404);
    expect(resMissing.body.error).toBe('PRODUCT_NOT_FOUND');
  });

  it('GET /api/forecast/alerts renvoie les alertes triées par urgence (daysBeforeStockout ASC)', async () => {
    const res = await request(app)
      .get('/api/forecast/alerts')
      .set('Authorization', `Bearer ${tokenDemo}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const alerts = res.body.data;

    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0); // Le seed contient plusieurs produits en rupture < 7 jours

    // Vérification du tri croissant
    for (let i = 0; i < alerts.length - 1; i++) {
      expect(alerts[i].daysBeforeStockout).toBeLessThanOrEqual(alerts[i + 1].daysBeforeStockout);
    }
  });
});
