'use strict';

const saleService = require('../services/saleService');

const saleController = {
  async getAll(req, res, next) {
    try {
      const data = await saleService.getAll(req.user.companyId, req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const sale = await saleService.getById(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: sale });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const sale = await saleService.create(req.user.companyId, req.user.userId, req.body);
      res.status(201).json({ success: true, data: sale });
    } catch (err) { next(err); }
  },

  async updateStatus(req, res, next) {
    try {
      const sale = await saleService.updateStatus(
        parseInt(req.params.id, 10),
        req.user.companyId,
        req.user.userId,
        req.body.status
      );
      res.json({ success: true, data: sale });
    } catch (err) { next(err); }
  },

  async getDashboard(req, res, next) {
    try {
      const data = await saleService.getDashboardData(req.user.companyId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};

module.exports = saleController;
