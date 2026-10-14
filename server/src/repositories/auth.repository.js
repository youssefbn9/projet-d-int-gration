'use strict';

const pool = require('../config/db');

const authRepository = {
  /**
   * Trouve un utilisateur par email (sans filtre company_id car avant authentification).
   * @param {string} email
   */
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  /**
   * Trouve un utilisateur par son identifiant.
   * @param {number} id
   */
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, company_id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Crée une entreprise et son utilisateur administrateur dans UNE SEULE transaction atomique.
   * @param {{ companyName: string, email: string, passwordHash: string, firstName: string, lastName: string }} data
   */
  async createCompanyWithAdmin({ companyName, email, passwordHash, firstName, lastName }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [companyResult] = await connection.query(
        'INSERT INTO companies (name) VALUES (?)',
        [companyName]
      );
      const companyId = companyResult.insertId;

      const [userResult] = await connection.query(
        'INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        [companyId, email, passwordHash, firstName, lastName, 'admin']
      );
      const userId = userResult.insertId;

      await connection.commit();
      return { userId, companyId };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
};

module.exports = authRepository;
