'use strict';

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const testDbName = 'stockpro_test';

  // 1. Connexion au serveur MySQL sans sélectionner de base
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    // 2. Recréation propre de la base stockpro_test
    await conn.query(`DROP DATABASE IF EXISTS \`${testDbName}\``);
    await conn.query(
      `CREATE DATABASE \`${testDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );

    // 3. Bascule sur stockpro_test
    await conn.query(`USE \`${testDbName}\``);

    // 4. Exécution du schéma SQL
    const schemaPath = path.join(__dirname, '../../sql/schema.production.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query(schemaSql);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.info(`\n⚙️ [Jest Global Setup] Base de test "${testDbName}" initialisée avec succès à partir de schema.production.sql.`);
  } catch (err) {
    console.error('❌ [Jest Global Setup] Échec d\'initialisation de la base de test:', err.message);
    throw err;
  } finally {
    await conn.end();
  }
};
