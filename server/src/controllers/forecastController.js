'use strict';

const forecastService = require('../services/forecastService');

const forecastController = {
  async getProductForecast(req, res, next) {
    try {
      const productId = parseInt(req.params.id, 10);
      const data = await forecastService.getProductForecast(productId, req.user.companyId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAlerts(req, res, next) {
    try {
      const data = await forecastService.getAlerts(req.user.companyId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = forecastController;

