'use strict';

require('dotenv').config();
const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 4000;

app.listen(PORT, () => {
  console.info(`✅ StockPro API démarrée sur http://localhost:${PORT}`);
  console.info(`📚 Documentation : http://localhost:${PORT}/api-docs`);
});
