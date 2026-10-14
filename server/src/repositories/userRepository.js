'use strict';

const pool = require('../config/db');

const userRepository = {
  /** Trouve un utilisateur par email (tous commerces, pour le login) */
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  /** Trouve un utilisateur par id dans le commerce donné */
  async findById(id, companyId) {
    const [rows] = await pool.query(
      'SELECT id, company_id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ? AND company_id = ? LIMIT 1',
      [id, companyId]
    );
    return rows[0] || null;
  },

  /** Liste tous les utilisateurs du commerce */
  async findAll(companyId) {
    const [rows] = await pool.query(
      'SELECT id, company_id, email, first_name, last_name, role, is_active, created_at FROM users WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    return rows;
  },

  /** Crée un utilisateur */
  async create({ companyId, email, passwordHash, firstName, lastName, role }) {
    const [result] = await pool.query(
      'INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [companyId, email, passwordHash, firstName, lastName, role]
    );
    return result.insertId;
  },

  /** Met à jour le profil d'un utilisateur */
  async update(id, companyId, fields) {
    const [result] = await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, role = ?, is_active = ? WHERE id = ? AND company_id = ?',
      [fields.firstName, fields.lastName, fields.role, fields.isActive, id, companyId]
    );
    return result.affectedRows;
  },

  /** Supprime un utilisateur */
  async remove(id, companyId) {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    return result.affectedRows;
  },
};

module.exports = userRepository;
