'use strict';

const customerService = require('../services/customerService');

const customerController = {
  async getAll(req, res, next) {
    try {
      const customers = await customerService.getAll(req.user.companyId);
      res.json({ success: true, data: customers });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const customer = await customerService.getById(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const customer = await customerService.create(req.user.companyId, req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const customer = await customerService.update(parseInt(req.params.id, 10), req.user.companyId, req.body);
      res.json({ success: true, data: customer });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await customerService.remove(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  },
};

module.exports = customerController;

