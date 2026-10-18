'use strict';

const pool = require('../config/db');

const saleRepository = {
  /** Crée une vente et ses lignes dans une transaction */
  async createWithItems(companyId, userId, items, totalAmount, note) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insérer la vente
      const [saleResult] = await conn.query(
        'INSERT INTO sales (company_id, user_id, total_amount, note) VALUES (?, ?, ?, ?)',
        [companyId, userId, totalAmount, note || null]
      );
      const saleId = saleResult.insertId;

      let calculatedTotal = 0;

      // Insérer les lignes et décrémenter le stock avec FOR UPDATE
      for (const item of items) {
        const [prodRows] = await conn.query(
          'SELECT stock_quantity, unit_price FROM products WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
          [item.productId, companyId]
        );
        const product = prodRows[0];
        if (!product) throw Object.assign(new Error(`Produit ${item.productId} introuvable`), { code: 'PRODUIT_INTROUVABLE', status: 404 });
        if (product.stock_quantity < item.quantity) {
          throw Object.assign(new Error(`Stock insuffisant pour le produit ${item.productId}`), { code: 'STOCK_INSUFFISANT', status: 400 });
        }

        const unitPrice = parseFloat(product.unit_price);
        const subtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
        calculatedTotal += subtotal;

        await conn.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [saleId, item.productId, item.quantity, unitPrice, subtotal]
        );

        await conn.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND company_id = ?',
          [item.quantity, item.productId, companyId]
        );

        // Mouvement de stock
        await conn.query(
          'INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason, sale_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [companyId, item.productId, userId, 'exit', -item.quantity, 'Vente', saleId]
        );
      }

      // Mettre à jour le total_amount réel de la vente
      await conn.query(
        'UPDATE sales SET total_amount = ? WHERE id = ?',
        [calculatedTotal.toFixed(2), saleId]
      );

      await conn.commit();
      return saleId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async findAll(companyId, { limit = 50, offset = 0 } = {}) {
    const [rows] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, COUNT(si.id) AS item_count
       FROM sales s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN sale_items si ON s.id = si.sale_id
       WHERE s.company_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [companyId, parseInt(limit, 10), parseInt(offset, 10)]
    );
    return rows;
  },

  async findById(id, companyId) {
    const [sales] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name
       FROM sales s JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.company_id = ? LIMIT 1`,
      [id, companyId]
    );
    if (!sales[0]) return null;

    const [items] = await pool.query(
      `SELECT si.*, p.name AS product_name, p.sku
       FROM sale_items si JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [id]
    );
    return { ...sales[0], items };
  },

  /** Revenus agrégés par jour sur N jours glissants */
  async getDailyRevenue(companyId, days = 30) {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS date, SUM(total_amount) AS revenue, COUNT(*) AS nb_sales
       FROM sales
       WHERE company_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND status = 'completed'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [companyId, days]
    );
    return rows;
  },

  /** Top N produits vendus */
  async getTopProducts(companyId, limit = 5) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, SUM(si.quantity) AS total_qty, SUM(si.subtotal) AS total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.company_id = ? AND s.status = 'completed'
       GROUP BY p.id, p.name
       ORDER BY total_qty DESC
       LIMIT ?`,
      [companyId, parseInt(limit, 10)]
    );
    return rows;
  },

  /** Nombre total de ventes finalisées du commerce */
  async getTotalSalesCount(companyId) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM sales WHERE company_id = ? AND status = 'completed'`,
      [companyId]
    );
    return rows[0]?.count || 0;
  },
};

module.exports = saleRepository;
