'use strict';

const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const authController = {
  /**
   * Inscription d'une nouvelle entreprise et de son compte admin.
   */
  async register(req, res, next) {
    try {
      const { companyName, name, email, password } = req.body;
      const result = await authService.register({ companyName, name, email, password });
      return success(res, result, 201, 'Compte et entreprise créés avec succès');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * Connexion utilisateur.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return success(res, result, 200, 'Connexion réussie');
    } catch (err) {
      return next(err);
    }
  },

  /**
   * Récupération de l'utilisateur courant (authentifié).
   */
  async me(req, res, next) {
    try {
      const user = await authService.getMe(req.user.userId);
      return success(res, user, 200);
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = authController;
