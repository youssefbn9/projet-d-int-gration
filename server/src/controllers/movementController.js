'use strict';

const movementService = require('../services/movementService');

const movementController = {
  async getAll(req, res, next) {
    try {
      res.json({ success: true, data: await movementService.getAll(req.user.companyId, req.query) });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const movement = await movementService.create(req.user.companyId, req.user.userId, req.body);
      res.status(201).json({ success: true, data: movement });
    } catch (err) { next(err); }
  },
};

module.exports = movementController;
