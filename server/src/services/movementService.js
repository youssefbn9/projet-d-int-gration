'use strict';

const movementRepository = require('../repositories/movementRepository');
const AppError = require('../utils/AppError');

const movementService = {
  async getAll(companyId, filters) {
    return movementRepository.findAll(companyId, filters);
  },

  async create(companyId, userId, { productId, type, quantity, reason }) {
    // Normaliser la quantité selon le type
    let adjustedQty = parseInt(quantity, 10);
    if (type === 'exit' && adjustedQty > 0) adjustedQty = -adjustedQty;

    try {
      const id = await movementRepository.create({
        companyId, productId, userId, type, quantity: adjustedQty, reason,
      });
      return { id, productId, type, quantity: adjustedQty, reason };
    } catch (err) {
      if (err.code === 'STOCK_INSUFFISANT') {
        throw new AppError('Stock insuffisant pour ce mouvement', 400, 'STOCK_INSUFFISANT');
      }
      if (err.code === 'PRODUIT_INTROUVABLE') {
        throw new AppError('Produit introuvable', 404, 'PRODUIT_INTROUVABLE');
      }
      throw err;
    }
  },
};

module.exports = movementService;
