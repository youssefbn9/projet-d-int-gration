'use strict';

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('PASSE 4/10: Ventes transactionnelles, stock et statistiques', () => {
  let tokenA;
  let tokenB;
  let companyAId;
  let companyBId;
  let product1;
  let product2;
  let createdSaleId;

  beforeAll(async () => {
    const timestamp = Date.now();

    // Inscription Commerce A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: `Commerce Test A ${timestamp}`,
        name: 'Admin Test A',
        email: `admin.testa.${timestamp}@test.com`,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    tokenA = resA.body.data.token;
    companyAId = resA.body.data.user.companyId;

    // Inscription Commerce B (Isolation)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: `Commerce Test B ${timestamp}`,
        name: 'Admin Test B',
        email: `admin.testb.${timestamp}@test.com`,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    tokenB = resB.body.data.token;
    companyBId = resB.body.data.user.companyId;

    // Création de 2 produits pour Commerce A
    const resP1 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Produit Test 1 ${timestamp}`,
        sku: `SKU-A1-${timestamp}`,
        price: 10.0,
        cost: 6.0,
        stock: 50,
        stockMin: 10,
      });
    expect(resP1.status).toBe(201);
    product1 = resP1.body.data;

    const resP2 = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: `Produit Test 2 ${timestamp}`,
        sku: `SKU-A2-${timestamp}`,
        price: 25.5,
        cost: 15.0,
        stock: 20,
        stockMin: 5,
      });
    expect(resP2.status).toBe(201);
    product2 = resP2.body.data;
  });

  afterAll(async () => {
    // Nettoyage des tests si nécessaire
    if (companyAId && companyBId) {
      await pool.query('DELETE FROM sales WHERE company_id IN (?, ?)', [companyAId, companyBId]);
      await pool.query('DELETE FROM stock_movements WHERE company_id IN (?, ?)', [companyAId, companyBId]);
      await pool.query('DELETE FROM products WHERE company_id IN (?, ?)', [companyAId, companyBId]);
      await pool.query('DELETE FROM users WHERE company_id IN (?, ?)', [companyAId, companyBId]);
      await pool.query('DELETE FROM companies WHERE id IN (?, ?)', [companyAId, companyBId]);
    }
    await pool.end();
  });

  // ── 1. Vente OK (stock diminué + mouvement créé + total exact) ───────────────
  it('1. Vente OK: crée la vente, décrémente le stock, crée le mouvement out et calcule le total exact', async () => {
    // Achat de 2 x product1 (10.00 DT) + 3 x product2 (25.50 DT)
    // Total attendu = 20.00 + 76.50 = 96.50 DT
    const resSale = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        items: [
          { productId: product1.id, quantity: 2 },
          { productId: product2.id, quantity: 3 },
        ],
        note: 'Première vente test',
      });

    expect(resSale.status).toBe(201);
    expect(resSale.body.success).toBe(true);
    const sale = resSale.body.data;
    createdSaleId = sale.id;

    expect(sale.status).toBe('pending');
    expect(parseFloat(sale.total_amount)).toBeCloseTo(96.5, 2);
    expect(sale.items).toHaveLength(2);

    // Vérifier les stocks mis à jour
    const resCheckP1 = await request(app)
      .get(`/api/products/${product1.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resCheckP1.body.data.stock_quantity).toBe(48); // 50 - 2

    const resCheckP2 = await request(app)
      .get(`/api/products/${product2.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resCheckP2.body.data.stock_quantity).toBe(17); // 20 - 3

    // Vérifier les mouvements de stock associés
    const resMovements = await request(app)
      .get(`/api/products/${product1.id}/movements`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resMovements.status).toBe(200);
    expect(resMovements.body.data.items.length).toBeGreaterThanOrEqual(1);

    const outMovement = resMovements.body.data.items.find(
      (m) => m.type === 'out' && m.reason === `Vente #${createdSaleId}`
    );
    expect(outMovement).toBeDefined();
    expect(outMovement.quantity).toBe(-2);
  });

  // ── 2. Stock insuffisant (rien modifié) ──────────────────────────────────────
  it('2. Stock insuffisant: refuse avec 409 INSUFFICIENT_STOCK et ne modifie rien', async () => {
    // Essayer de commander 999 unités de product1 (stock actuel: 48)
    const resInsuff = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        items: [
          { productId: product1.id, quantity: 999 },
        ],
      });

    expect(resInsuff.status).toBe(409);
    expect(resInsuff.body.code).toBe('INSUFFICIENT_STOCK');

    // Vérifier que le stock n'a absolument pas bougé
    const resCheckP1 = await request(app)
      .get(`/api/products/${product1.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resCheckP1.body.data.stock_quantity).toBe(48);
  });

  // ── 3. Annulation (stock restitué et mouvement 'in' créé) ─────────────────────
  it('3. Annulation: passage à cancelled restitue le stock et crée les mouvements in', async () => {
    const resCancel = await request(app)
      .patch(`/api/sales/${createdSaleId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'cancelled' });

    expect(resCancel.status).toBe(200);
    expect(resCancel.body.data.status).toBe('cancelled');

    // Le stock de product1 doit être revenu à 50 (48 + 2)
    const resCheckP1 = await request(app)
      .get(`/api/products/${product1.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resCheckP1.body.data.stock_quantity).toBe(50);

    // Le stock de product2 doit être revenu à 20 (17 + 3)
    const resCheckP2 = await request(app)
      .get(`/api/products/${product2.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resCheckP2.body.data.stock_quantity).toBe(20);

    // Vérifier le mouvement 'in' pour l'annulation
    const resMovements = await request(app)
      .get(`/api/products/${product1.id}/movements`)
      .set('Authorization', `Bearer ${tokenA}`);
    const inMovement = resMovements.body.data.items.find(
      (m) => m.type === 'in' && m.reason === `Annulation vente #${createdSaleId}`
    );
    expect(inMovement).toBeDefined();
    expect(inMovement.quantity).toBe(2);
  });

  // ── 4. Double annulation refusée ─────────────────────────────────────────────
  it('4. Double annulation: refuse avec 409 INVALID_STATUS_TRANSITION sans ré-augmenter le stock', async () => {
    const resDouble = await request(app)
      .patch(`/api/sales/${createdSaleId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'cancelled' });

    expect(resDouble.status).toBe(409);
    expect(resDouble.body.code).toBe('INVALID_STATUS_TRANSITION');

    // Vérifier que le stock n'a pas été re-crédité une seconde fois
    const resCheckP1 = await request(app)
      .get(`/api/products/${product1.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resCheckP1.body.data.stock_quantity).toBe(50);
  });

  // ── 5. Isolation entre commerces ─────────────────────────────────────────────
  it('5. Isolation: un autre commerce ne peut ni voir, ni modifier, ni acheter les produits d\'un autre', async () => {
    // 5.1 Tentative d'accès à la vente du Commerce A par Commerce B
    const resGetOtherSale = await request(app)
      .get(`/api/sales/${createdSaleId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(resGetOtherSale.status).toBe(404);

    // 5.2 Tentative de changement de statut par Commerce B
    const resPatchOtherSale = await request(app)
      .patch(`/api/sales/${createdSaleId}/status`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ status: 'paid' });
    expect(resPatchOtherSale.status).toBe(404);

    // 5.3 Tentative d'achat d'un produit appartenant au Commerce A par Commerce B
    const resBuyOtherProduct = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        items: [{ productId: product1.id, quantity: 1 }],
      });
    expect(resBuyOtherProduct.status).toBe(404);
  });

  // ── 6. Ajustement de stock & Dashboard ────────────────────────────────────────
  it('6. POST /api/stock/adjust ajuste le stock et GET /api/dashboard/stats fonctionne', async () => {
    // Ajustement de stock: type 'adjustment'
    const resAdjust = await request(app)
      .post('/api/stock/adjust')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        productId: product1.id,
        type: 'adjustment',
        quantity: 8,
        reason: 'Inventaire physique',
      });
    expect(resAdjust.status).toBe(200);
    expect(resAdjust.body.data.newStock).toBe(8);

    // Vérification dashboard stats
    const resDashboard = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(resDashboard.status).toBe(200);
    expect(resDashboard.body.success).toBe(true);
    expect(resDashboard.body.data).toHaveProperty('monthRevenue');
    expect(resDashboard.body.data).toHaveProperty('monthSalesCount');
    expect(resDashboard.body.data).toHaveProperty('lowStockProducts');
    expect(resDashboard.body.data).toHaveProperty('salesByDay');
    expect(resDashboard.body.data.salesByDay).toHaveLength(30);
    expect(resDashboard.body.data).toHaveProperty('topProducts');
  });
});
