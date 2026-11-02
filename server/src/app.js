'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const saleRoutes = require('./routes/sale.routes');
const customerRoutes = require('./routes/customer.routes');
const stockRoutes = require('./routes/stock.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const { categoryRouter, supplierRouter, movementRouter } = require('./routes/misc.routes');

const app = express();

// ── Middlewares globaux ───────────────────────────────────────────────────────
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// ── Documentation OpenAPI / Swagger UI ────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Alias

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/movements', movementRouter);

// ── Santé ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

// ── Route non trouvée (404) ───────────────────────────────────────────────────
app.use(notFound);

// ── Gestionnaire d'erreurs global ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
