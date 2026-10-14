'use strict';

const pool = require('../config/db');

const productRepository = {
  /** Liste tous les produits du commerce avec catégorie et fournisseur */
  async findAll(companyId, { search, categoryId, lowStock } = {}) {
    let sql = `
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s  ON p.supplier_id  = s.id
      WHERE p.company_id = ?
    `;
    const params = [companyId];

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    if (lowStock === 'true' || lowStock === true) {
      sql += ' AND p.stock_quantity <= p.stock_min';
    }

    sql += ' ORDER BY p.name ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id, companyId) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, s.name AS supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s  ON p.supplier_id  = s.id
       WHERE p.id = ? AND p.company_id = ? LIMIT 1`,
      [id, companyId]
    );
    return rows[0] || null;
  },

  /** SELECT ... FOR UPDATE dans une transaction existante */
  async findByIdForUpdate(conn, id, companyId) {
    const [rows] = await conn.query(
      'SELECT * FROM products WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
      [id, companyId]
    );
    return rows[0] || null;
  },

  async create({ companyId, categoryId, supplierId, sku, name, description, unitPrice, stockQuantity, stockMin, imageUrl }) {
    const [result] = await pool.query(
      'INSERT INTO products (company_id, category_id, supplier_id, sku, name, description, unit_price, stock_quantity, stock_min, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [companyId, categoryId || null, supplierId || null, sku, name, description || null, unitPrice, stockQuantity, stockMin, imageUrl || null]
    );
    return result.insertId;
  },

  async update(id, companyId, fields) {
    const [result] = await pool.query(
      'UPDATE products SET category_id=?, supplier_id=?, sku=?, name=?, description=?, unit_price=?, stock_quantity=?, stock_min=?, image_url=? WHERE id=? AND company_id=?',
      [
        fields.categoryId || null, fields.supplierId || null,
        fields.sku, fields.name, fields.description || null,
        fields.unitPrice, fields.stockQuantity, fields.stockMin,
        fields.imageUrl || null, id, companyId,
      ]
    );
    return result.affectedRows;
  },

  /** Met à jour seulement le stock (dans une transaction) */
  async updateStock(conn, id, companyId, newQuantity) {
    await conn.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ? AND company_id = ?',
      [newQuantity, id, companyId]
    );
  },

  async remove(id, companyId) {
    const [result] = await pool.query(
      'DELETE FROM products WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return result.affectedRows;
  },

  /** Statistiques de stock pour le dashboard */
  async getStockStats(companyId) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_products,
         SUM(stock_quantity) AS total_stock,
         SUM(CASE WHEN stock_quantity <= stock_min THEN 1 ELSE 0 END) AS low_stock_count,
         SUM(stock_quantity * unit_price) AS stock_value
       FROM products WHERE company_id = ?`,
      [companyId]
    );
    return rows[0];
  },
};

module.exports = productRepository;
