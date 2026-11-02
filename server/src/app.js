'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const pool = require('./config/db');
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
const forecastRoutes = require('./routes/forecast.routes');
const { categoryRouter, supplierRouter, movementRouter } = require('./routes/misc.routes');

const app = express();

// ── Sécurité & Middlewares globaux ────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Permet le rendu correct de Swagger UI
  })
);
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Limiteur de requêtes strict sur l'authentification (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'test' ? 1000 : 20, // 20 tentatives max par IP en prod/dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    code: 'TOO_MANY_REQUESTS',
    message: 'Trop de tentatives sur cette ressource. Veuillez réessayer dans 15 minutes.',
  },
});

// ── Documentation OpenAPI / Swagger UI ────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Alias

// ── Endpoint Santé (Statut + Test de connexion DB managée) ─────────────────────
app.get(['/health', '/api/health'], async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: 'DATABASE_UNAVAILABLE',
      message: 'Base de données inaccessible',
      details: err.message,
    });
  }
});

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/movements', movementRouter);

// ── Route non trouvée (404) ───────────────────────────────────────────────────
app.use(notFound);

// ── Gestionnaire d'erreurs global ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
