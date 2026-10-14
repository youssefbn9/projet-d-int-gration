'use strict';

const userService = require('../services/userService');

const userController = {
  async getAll(req, res, next) {
    try {
      const users = await userService.getAll(req.user.companyId);
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const user = await userService.getById(parseInt(req.params.id, 10), req.user.companyId);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const user = await userService.create({
        companyId: req.user.companyId, email, password, firstName, lastName, role,
      });
      res.status(201).json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const { firstName, lastName, role, isActive } = req.body;
      const user = await userService.update(
        parseInt(req.params.id, 10),
        req.user.companyId,
        { firstName, lastName, role, isActive }
      );
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async remove(req, res, next) {
    try {
      await userService.remove(
        parseInt(req.params.id, 10),
        req.user.companyId,
        req.user.userId
      );
      res.json({ success: true, data: null });
    } catch (err) { next(err); }
  },
};

module.exports = userController;
