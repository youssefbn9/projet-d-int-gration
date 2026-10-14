'use strict';

const supplierService = require('../services/supplierService');

const supplierController = {
  async getAll(req, res, next) {
    try {
      res.json({ success: true, data: await supplierService.getAll(req.user.companyId) });
    } catch (err) { next(err); }
  },
  async getById(req, res, next) {
    try {
      const sup = await supplierService.getById(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: sup });
    } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const sup = await supplierService.create(req.user.companyId, req.body);
      res.status(201).json({ success: true, data: sup });
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const sup = await supplierService.update(parseInt(req.params.id, 10), req.user.companyId, req.body);
      res.json({ success: true, data: sup });
    } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await supplierService.remove(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  },
};

module.exports = supplierController;
