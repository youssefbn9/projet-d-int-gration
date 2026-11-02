'use strict';

const productService = require('../services/productService');

const productController = {
  async getAll(req, res, next) {
    try {
      const data = await productService.getAll(req.user.companyId, req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.getById(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const product = await productService.create(req.user.companyId, req.user.userId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const product = await productService.update(
        parseInt(req.params.id, 10),
        req.user.companyId,
        req.body
      );
      res.json({ success: true, data: product });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await productService.remove(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  },

  async getStats(req, res, next) {
    try {
      const stats = await productService.getStockStats(req.user.companyId);
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  async getMovements(req, res, next) {
    try {
      const movements = await productService.getMovements(
        parseInt(req.params.id, 10),
        req.user.companyId,
        req.query
      );
      res.json({ success: true, data: movements });
    } catch (err) { next(err); }
  },
};

module.exports = productController;
