'use strict';

const pool = require('../config/db');

const movementRepository = {
  async findAll(companyId, { productId, type, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT m.*, p.name AS product_name, p.sku,
             u.first_name, u.last_name
      FROM stock_movements m
      JOIN products p ON m.product_id = p.id
      JOIN users u    ON m.user_id    = u.id
      WHERE m.company_id = ?
    `;
    const params = [companyId];

    if (productId) { sql += ' AND m.product_id = ?'; params.push(productId); }
    if (type)      { sql += ' AND m.type = ?';       params.push(type); }

    sql += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async create({ companyId, productId, userId, type, quantity, reason }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [prodRows] = await conn.query(
        'SELECT stock_quantity FROM products WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
        [productId, companyId]
      );
      if (!prodRows[0]) throw Object.assign(new Error('Produit introuvable'), { code: 'PRODUIT_INTROUVABLE', status: 404 });

      const newQty = prodRows[0].stock_quantity + quantity;
      if (newQty < 0) throw Object.assign(new Error('Stock insuffisant'), { code: 'STOCK_INSUFFISANT', status: 400 });

      await conn.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ? AND company_id = ?',
        [newQty, productId, companyId]
      );

      const [result] = await conn.query(
        'INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [companyId, productId, userId, type, quantity, reason || null]
      );

      await conn.commit();
      return result.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = movementRepository;
