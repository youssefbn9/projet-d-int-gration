'use strict';

const saleRepository = require('../repositories/saleRepository');
const AppError = require('../utils/AppError');

const saleService = {
  async create(companyId, userId, data) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new AppError('La vente doit contenir au moins un article', 400, 'VENTE_VIDE');
    }

    try {
      const saleId = await saleRepository.createWithItems(companyId, userId, data);
      return saleRepository.findById(saleId, companyId);
    } catch (err) {
      if (err.code === 'INSUFFICIENT_STOCK' || err.code === 'STOCK_INSUFFISANT') {
        throw new AppError(err.message, 409, 'INSUFFICIENT_STOCK');
      }
      if (err.code === 'PRODUIT_INTROUVABLE') {
        throw new AppError(err.message, 404, 'PRODUIT_INTROUVABLE');
      }
      if (err.code === 'CLIENT_INTROUVABLE') {
        throw new AppError(err.message, 404, 'CLIENT_INTROUVABLE');
      }
      throw err;
    }
  },

  async getAll(companyId, filters) {
    return saleRepository.findAll(companyId, filters);
  },

  async getById(id, companyId) {
    const sale = await saleRepository.findById(id, companyId);
    if (!sale) throw new AppError('Vente introuvable', 404, 'VENTE_INTROUVABLE');
    return sale;
  },

  async updateStatus(id, companyId, userId, status) {
    try {
      return await saleRepository.updateStatus(id, companyId, userId, status);
    } catch (err) {
      if (err.code === 'INVALID_STATUS_TRANSITION') {
        throw new AppError(err.message, 409, 'INVALID_STATUS_TRANSITION');
      }
      if (err.code === 'VENTE_INTROUVABLE') {
        throw new AppError(err.message, 404, 'VENTE_INTROUVABLE');
      }
      throw err;
    }
  },

  async getDashboardData(companyId) {
    return saleRepository.getDashboardStats(companyId);
  },
};

module.exports = saleService;
