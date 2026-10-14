'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const saleRoutes = require('./routes/sale.routes');
const { categoryRouter, supplierRouter, movementRouter } = require('./routes/misc.routes');

const app = express();

// ── Middlewares globaux ───────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Documentation API ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/movements', movementRouter);

// ── Santé ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'ROUTE_INTROUVABLE', message: 'Route introuvable' }));

// ── Gestionnaire d'erreurs global ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
