'use strict';

const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
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

  async create({ companyId, email, password, firstName, lastName, role = 'staff' }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTANT');

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await userRepository.create({
      companyId,
      email: normalizedEmail,
      passwordHash,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
    });
    return userRepository.findById(id, companyId);
  },

  async update(id, companyId, requesterId, fields) {
    const existing = await this.getById(id, companyId);

    // Règle : un utilisateur ne peut pas changer son propre rôle
    if (id === requesterId && fields.role && fields.role !== existing.role) {
      throw new AppError('Vous ne pouvez pas modifier votre propre rôle', 400, 'AUTO_ROLE_CHANGE');
    }

    const updateData = {
      firstName: fields.firstName ? fields.firstName.trim() : existing.first_name,
      lastName: fields.lastName ? fields.lastName.trim() : existing.last_name,
      role: fields.role || existing.role,
      isActive: fields.isActive !== undefined ? fields.isActive : existing.is_active,
    };

    await userRepository.update(id, companyId, updateData);
    return userRepository.findById(id, companyId);
  },

  async remove(id, companyId, requesterId) {
    // Règle : un utilisateur ne peut pas se supprimer lui-même
    if (id === requesterId) {
      throw new AppError('Vous ne pouvez pas vous supprimer vous-même', 400, 'AUTO_SUPPRESSION');
    }

    await this.getById(id, companyId);

    const salesCount = await userRepository.countSales(id, companyId);
    if (salesCount > 0) {
      throw new AppError(
        'Impossible de supprimer cet utilisateur car des ventes lui sont associées',
        409,
        'USER_HAS_SALES'
      );
    }

    await userRepository.remove(id, companyId);
  },
};

module.exports = userService;
