'use strict';

const pool = require('../config/db');

const customerRepository = {
  async findAll(companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    );
    return rows;
  },

  async findById(id, companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND company_id = ? LIMIT 1',
      [id, companyId]
    );
    return rows[0] || null;
  },

  async countSales(id, companyId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM sales WHERE customer_id = ? AND company_id = ?',
      [id, companyId]
    );
    return rows[0]?.count || 0;
  },

  async create({ companyId, name, email, phone }) {
    const [result] = await pool.query(
      'INSERT INTO customers (company_id, name, email, phone) VALUES (?, ?, ?, ?)',
      [companyId, name, email || null, phone || null]
    );
    return result.insertId;
  },

  async update(id, companyId, fields) {
    const [result] = await pool.query(
      'UPDATE customers SET name=?, email=?, phone=? WHERE id=? AND company_id=?',
      [fields.name, fields.email || null, fields.phone || null, id, companyId]
    );
    return result.affectedRows;
  },

  async remove(id, companyId) {
    const [result] = await pool.query(
      'DELETE FROM customers WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return result.affectedRows;
  },
};

module.exports = customerRepository;
