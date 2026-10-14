'use strict';

const userRepository = require('../repositories/userRepository');
const authService = require('./authService');
const AppError = require('../utils/AppError');

const userService = {
  async getAll(companyId) {
    return userRepository.findAll(companyId);
  },

  async getById(id, companyId) {
    const user = await userRepository.findById(id, companyId);
    if (!user) throw new AppError('Utilisateur introuvable', 404, 'UTILISATEUR_INTROUVABLE');
    return user;
  },

  async create({ companyId, email, password, firstName, lastName, role }) {
    // Vérifier si l'email existe déjà
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTANT');

    const passwordHash = await authService.hashPassword(password);
    const id = await userRepository.create({ companyId, email, passwordHash, firstName, lastName, role });
    return userRepository.findById(id, companyId);
  },

  async update(id, companyId, fields) {
    await this.getById(id, companyId); // vérifie l'existence
    const affected = await userRepository.update(id, companyId, fields);
    if (!affected) throw new AppError('Mise à jour échouée', 500, 'ERREUR_SERVEUR');
    return userRepository.findById(id, companyId);
  },

  async remove(id, companyId, requesterId) {
    if (id === requesterId) throw new AppError('Vous ne pouvez pas vous supprimer vous-même', 400, 'AUTO_SUPPRESSION');
    await this.getById(id, companyId);
    await userRepository.remove(id, companyId);
  },
};

module.exports = userService;
