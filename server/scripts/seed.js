'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Créer deux entreprises
    const [c1] = await conn.query("INSERT INTO companies (name) VALUES (?)", ['Boutique Alpha']);
    const [c2] = await conn.query("INSERT INTO companies (name) VALUES (?)", ['Épicerie Beta']);
    const companyId1 = c1.insertId;
    const companyId2 = c2.insertId;

    // Hasher les mots de passe
    const hash = (pwd) => bcrypt.hash(pwd, 10);
    const adminHash = await hash('Admin1234!');
    const staffHash = await hash('Staff1234!');

    // Utilisateurs
    await conn.query(
      "INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?,?,?,?,?,?)",
      [companyId1, 'admin@alpha.com', adminHash, 'Alice', 'Durand', 'admin']
    );
    await conn.query(
      "INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?,?,?,?,?,?)",
      [companyId1, 'staff@alpha.com', staffHash, 'Bob', 'Martin', 'staff']
    );
    await conn.query(
      "INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?,?,?,?,?,?)",
      [companyId2, 'admin@beta.com', adminHash, 'Clara', 'Petit', 'admin']
    );

    // Catégories Alpha
    const [cat1] = await conn.query("INSERT INTO categories (company_id, name) VALUES (?,?)", [companyId1, 'Électronique']);
    const [cat2] = await conn.query("INSERT INTO categories (company_id, name) VALUES (?,?)", [companyId1, 'Vêtements']);

    // Fournisseurs Alpha
    const [sup1] = await conn.query(
      "INSERT INTO suppliers (company_id, name, email, phone) VALUES (?,?,?,?)",
      [companyId1, 'TechSupply SA', 'contact@techsupply.fr', '0123456789']
    );

    // Produits Alpha
    const products = [
      { sku: 'ELEC-001', name: 'Smartphone XS', cat: cat1.insertId, sup: sup1.insertId, price: 599.99, qty: 50, min: 5 },
      { sku: 'ELEC-002', name: 'Casque Bluetooth', cat: cat1.insertId, sup: sup1.insertId, price: 89.99, qty: 3, min: 5 },
      { sku: 'ELEC-003', name: 'Tablette Pro 10"', cat: cat1.insertId, sup: sup1.insertId, price: 349.99, qty: 20, min: 3 },
      { sku: 'VET-001', name: 'T-Shirt Premium', cat: cat2.insertId, sup: null, price: 24.99, qty: 100, min: 10 },
      { sku: 'VET-002', name: 'Jean Slim Fit', cat: cat2.insertId, sup: null, price: 59.99, qty: 2, min: 5 },
    ];

    for (const p of products) {
      await conn.query(
        "INSERT INTO products (company_id, category_id, supplier_id, sku, name, unit_price, stock_quantity, stock_min) VALUES (?,?,?,?,?,?,?,?)",
        [companyId1, p.cat, p.sup, p.sku, p.name, p.price, p.qty, p.min]
      );
    }

    // Catégories et produits Beta
    const [catAlim] = await conn.query("INSERT INTO categories (company_id, name) VALUES (?,?)", [companyId2, 'Alimentation']);
    await conn.query(
      "INSERT INTO products (company_id, category_id, sku, name, unit_price, stock_quantity, stock_min) VALUES (?,?,?,?,?,?,?)",
      [companyId2, catAlim.insertId, 'ALIM-001', 'Huile d\'olive Bio 1L', 8.99, 200, 20]
    );

    await conn.commit();
    console.info('✅ Base de données initialisée avec succès');
    console.info('  Boutique Alpha → admin@alpha.com / Admin1234!');
    console.info('  Boutique Alpha → staff@alpha.com / Staff1234!');
    console.info('  Épicerie Beta  → admin@beta.com  / Admin1234!');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Erreur seed :', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
