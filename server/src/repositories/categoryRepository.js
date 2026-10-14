'use strict';

const pool = require('../config/db');

const categoryRepository = {
  async findAll(companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    );
    return rows;
  },

  async findById(id, companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE id = ? AND company_id = ? LIMIT 1',
      [id, companyId]
    );
    return rows[0] || null;
  },

  async create(companyId, name) {
    const [result] = await pool.query(
      'INSERT INTO categories (company_id, name) VALUES (?, ?)',
      [companyId, name]
    );
    return result.insertId;
  },

  async update(id, companyId, name) {
    const [result] = await pool.query(
      'UPDATE categories SET name = ? WHERE id = ? AND company_id = ?',
      [name, id, companyId]
    );
    return result.affectedRows;
  },

  async remove(id, companyId) {
    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return result.affectedRows;
  },
};

module.exports = categoryRepository;
