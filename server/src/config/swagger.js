'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StockPro API',
      version: '1.0.0',
      description: 'API REST de gestion de stock et de ventes multi-commerces',
    },
    servers: [{ url: 'http://localhost:4000/api', description: 'Serveur local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
