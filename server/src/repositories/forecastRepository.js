'use strict';

const pool = require('../config/db');

/**
 * Construit un tableau chronologique des 30 derniers jours (de J-29 à aujourd'hui)
 * en injectant 0 pour les jours sans vente.
 *
 * @param {Map<string, number>} salesMap map date -> quantité vendue
 * @returns {Array<{date: string, quantity: number}>}
 */
function build30DaysTimeline(salesMap) {
  const timeline = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    timeline.push({
      date: dateStr,
      quantity: salesMap.get(dateStr) || 0,
    });
  }
  return timeline;
}

const forecastRepository = {
  /**
   * Récupère un produit et son historique des ventes journalières sur 30 jours
   */
  async getProductWithHistory(productId, companyId) {
    const [prodRows] = await pool.query(
      'SELECT id, name, sku, stock_quantity, stock_min, unit_price FROM products WHERE id = ? AND company_id = ? LIMIT 1',
      [productId, companyId]
    );
    const product = prodRows[0];
    if (!product) return null;

    const [salesRows] = await pool.query(
      `SELECT
         DATE_FORMAT(s.created_at, '%Y-%m-%d') AS sale_date,
         COALESCE(SUM(si.quantity), 0) AS total_qty
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       WHERE s.company_id = ?
         AND si.product_id = ?
         AND s.status != 'cancelled'
         AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY DATE_FORMAT(s.created_at, '%Y-%m-%d')`,
      [companyId, productId]
    );

    const salesMap = new Map();
    for (const row of salesRows) {
      salesMap.set(row.sale_date, parseInt(row.total_qty, 10) || 0);
    }

    const history = build30DaysTimeline(salesMap);

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock_quantity,
        stockMin: product.stock_min,
      },
      history,
    };
  },

  /**
   * Récupère tous les produits et leur historique 30 jours en UNE SEULE requête groupée (pas de N+1)
   */
  async getAllProductsWithHistory(companyId) {
    const [products] = await pool.query(
      'SELECT id, name, sku, stock_quantity, stock_min, unit_price FROM products WHERE company_id = ?',
      [companyId]
    );

    if (products.length === 0) return [];

    // Une seule requête SQL groupée par produit et par jour
    const [salesRows] = await pool.query(
      `SELECT
         si.product_id,
         DATE_FORMAT(s.created_at, '%Y-%m-%d') AS sale_date,
         COALESCE(SUM(si.quantity), 0) AS total_qty
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       WHERE s.company_id = ?
         AND s.status != 'cancelled'
         AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY si.product_id, DATE_FORMAT(s.created_at, '%Y-%m-%d')`,
      [companyId]
    );

    // Dictionnaire multidimensionnel : productId -> Map(date -> qty)
    const productSalesMap = new Map();
    for (const row of salesRows) {
      const pid = row.product_id;
      if (!productSalesMap.has(pid)) {
        productSalesMap.set(pid, new Map());
      }
      productSalesMap.get(pid).set(row.sale_date, parseInt(row.total_qty, 10) || 0);
    }

    return products.map((prod) => {
      const salesMap = productSalesMap.get(prod.id) || new Map();
      const history = build30DaysTimeline(salesMap);

      return {
        product: {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          stock: prod.stock_quantity,
          stockMin: prod.stock_min,
        },
        history,
      };
    });
  },
};

module.exports = forecastRepository;
