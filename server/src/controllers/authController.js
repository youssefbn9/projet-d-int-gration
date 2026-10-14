'use strict';

const authService = require('../services/authService');

const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res) {
    res.status(200).json({ success: true, data: req.user });
  },
};

module.exports = authController;
