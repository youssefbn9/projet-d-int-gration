'use strict';

const forecastRepository = require('../repositories/forecastRepository');
const { generateForecast } = require('../ml/forecast');
const AppError = require('../utils/AppError');

const forecastService = {
  /**
   * Prévision détaillée sur 7 jours pour un produit spécifique
   */
  async getProductForecast(productId, companyId) {
    const data = await forecastRepository.getProductWithHistory(productId, companyId);
    if (!data) {
      throw new AppError('Produit introuvable pour ce commerce', 404, 'PRODUCT_NOT_FOUND');
    }

    const fc = generateForecast(data.history, data.product.stock);

    return {
      product: data.product,
      history: fc.history,
      forecast: fc.forecast,
      model: fc.model,
      avgForecastPerDay: fc.avgForecastPerDay,
      daysBeforeStockout: fc.daysBeforeStockout,
      alert: fc.alert,
    };
  },

  /**
   * Liste des alertes de rupture imminente (< 7 jours) calculée sans problème N+1
   */
  async getAlerts(companyId) {
    const productsWithHistory = await forecastRepository.getAllProductsWithHistory(companyId);

    const alerts = [];
    for (const item of productsWithHistory) {
      const fc = generateForecast(item.history, item.product.stock);

      if (fc.alert) {
        alerts.push({
          product: item.product,
          avgForecastPerDay: fc.avgForecastPerDay,
          daysBeforeStockout: fc.daysBeforeStockout,
          model: fc.model,
          forecast: fc.forecast,
        });
      }
    }

    // Tri par urgence croissante (rupture la plus proche en premier)
    alerts.sort((a, b) => {
      const aVal = a.daysBeforeStockout !== null ? a.daysBeforeStockout : 999;
      const bVal = b.daysBeforeStockout !== null ? b.daysBeforeStockout : 999;
      return aVal - bVal;
    });

    return alerts;
  },
};

module.exports = forecastService;
