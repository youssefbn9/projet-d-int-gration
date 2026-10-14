'use strict';

const pool = require('../config/db');

const supplierRepository = {
  async findAll(companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM suppliers WHERE company_id = ? ORDER BY name ASC',
      [companyId]
    );
    return rows;
  },

  async findById(id, companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM suppliers WHERE id = ? AND company_id = ? LIMIT 1',
      [id, companyId]
    );
    return rows[0] || null;
  },

  async create({ companyId, name, email, phone, address }) {
    const [result] = await pool.query(
      'INSERT INTO suppliers (company_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [companyId, name, email || null, phone || null, address || null]
    );
    return result.insertId;
  },

  async update(id, companyId, fields) {
    const [result] = await pool.query(
      'UPDATE suppliers SET name=?, email=?, phone=?, address=? WHERE id=? AND company_id=?',
      [fields.name, fields.email || null, fields.phone || null, fields.address || null, id, companyId]
    );
    return result.affectedRows;
  },

  async remove(id, companyId) {
    const [result] = await pool.query(
      'DELETE FROM suppliers WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return result.affectedRows;
  },
};

module.exports = supplierRepository;
