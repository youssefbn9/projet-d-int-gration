'use strict';

const pool = require('../src/config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        company_id INT UNSIGNED NOT NULL,
        name       VARCHAR(120) NOT NULL,
        email      VARCHAR(191),
        phone      VARCHAR(30),
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cust_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Table customers vérifiée/créée.');

    try {
      await pool.query('ALTER TABLE products ADD COLUMN cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER unit_price');
      console.log('✅ Colonne products.cost ajoutée.');
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.warn('Note products.cost:', err.message);
      }
    }

    try {
      await pool.query('ALTER TABLE sales ADD COLUMN customer_id INT UNSIGNED NULL AFTER user_id');
      await pool.query('ALTER TABLE sales ADD CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT');
      console.log('✅ Colonne sales.customer_id ajoutée.');
    } catch (err) {
      if (!err.message.includes('Duplicate column') && !err.message.includes('already exists')) {
        console.warn('Note sales.customer_id:', err.message);
      }
    }

    try {
      await pool.query("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('entry','exit','adjustment','in','out') NOT NULL");
      console.log('✅ Colonne stock_movements.type mise à jour.');
    } catch (err) {
      console.warn('Note stock_movements.type:', err.message);
    }

    try {
      await pool.query("ALTER TABLE sales MODIFY COLUMN status ENUM('pending','paid','cancelled','completed') NOT NULL DEFAULT 'pending'");
      console.log('✅ Colonne sales.status mise à jour (pending, paid, cancelled, completed).');
    } catch (err) {
      console.warn('Note sales.status:', err.message);
    }

    // Index unique category name per company
    try {
      await pool.query('ALTER TABLE categories ADD UNIQUE KEY uq_cat_name (company_id, name)');
      console.log('✅ Index unique sur categories(company_id, name) ajouté.');
    } catch (err) {
      if (!err.message.includes('already exists') && !err.message.includes('Duplicate key')) {
        console.warn('Note categories unique key:', err.message);
      }
    }

    console.log('Migration terminée avec succès.');
  } catch (err) {
    console.error('Erreur migration:', err);
  } finally {
    await pool.end();
  }
}

migrate();

