'use strict';

const categoryService = require('../services/categoryService');

const categoryController = {
  async getAll(req, res, next) {
    try {
      res.json({ success: true, data: await categoryService.getAll(req.user.companyId) });
    } catch (err) { next(err); }
  },
  async create(req, res, next) {
    try {
      const cat = await categoryService.create(req.user.companyId, req.body.name);
      res.status(201).json({ success: true, data: cat });
    } catch (err) { next(err); }
  },
  async update(req, res, next) {
    try {
      const cat = await categoryService.update(parseInt(req.params.id, 10), req.user.companyId, req.body.name);
      res.json({ success: true, data: cat });
    } catch (err) { next(err); }
  },
  async remove(req, res, next) {
    try {
      await categoryService.remove(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  },
};

module.exports = categoryController;
