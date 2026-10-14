'use strict';

const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');

const startServer = async () => {
  try {
    await pool.testConnection();
    console.info('✅ Connexion MySQL réussie.');

    app.listen(env.port, () => {
      console.info(`✅ StockPro API démarrée sur http://localhost:${env.port}`);
      console.info(`📚 Documentation : http://localhost:${env.port}/api/docs`);
    });
  } catch (err) {
    console.error('❌ Échec de la connexion à la base de données :', err.message);
    process.exit(1);
  }
};

startServer();
