'use strict';

const saleRepository = require('../repositories/saleRepository');
const AppError = require('../utils/AppError');

const saleService = {
  async create(companyId, userId, { items, note }) {
    if (!items || items.length === 0) {
      throw new AppError('La vente doit contenir au moins un article', 400, 'VENTE_VIDE');
    }

    // Le calcul du total réel se fait dans le repo via les prix en base
    try {
      const saleId = await saleRepository.createWithItems(companyId, userId, items, 0, note);
      return saleRepository.findById(saleId, companyId);
    } catch (err) {
      if (err.code === 'STOCK_INSUFFISANT') {
        throw new AppError(err.message, 400, 'STOCK_INSUFFISANT');
      }
      if (err.code === 'PRODUIT_INTROUVABLE') {
        throw new AppError(err.message, 404, 'PRODUIT_INTROUVABLE');
      }
      throw err;
    }
  },

  async getAll(companyId, pagination) {
    return saleRepository.findAll(companyId, pagination);
  },

  async getById(id, companyId) {
    const sale = await saleRepository.findById(id, companyId);
    if (!sale) throw new AppError('Vente introuvable', 404, 'VENTE_INTROUVABLE');
    return sale;
  },

  async getDashboardData(companyId) {
    const [revenue, topProducts] = await Promise.all([
      saleRepository.getDailyRevenue(companyId, 30),
      saleRepository.getTopProducts(companyId, 5),
    ]);
    return { revenue, topProducts };
  },
};

module.exports = saleService;
