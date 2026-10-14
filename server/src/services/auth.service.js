'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const SALT_ROUNDS = 10;

const authService = {
  /**
   * Enregistre une nouvelle entreprise et son administrateur.
   * @param {{ companyName: string, name: string, email: string, password: string }} data
   */
  async register({ companyName, name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await authRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_ALREADY_USED');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const { userId, companyId } = await authRepository.createCompanyWithAdmin({
      companyName: companyName.trim(),
      email: normalizedEmail,
      passwordHash,
      firstName,
      lastName,
    });

    const token = jwt.sign(
      { userId, companyId, role: 'admin' },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return {
      token,
      user: {
        id: userId,
        companyId,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email: normalizedEmail,
        role: 'admin',
      },
    };
  },

  /**
   * Authentifie un utilisateur par email et mot de passe.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const user = await authRepository.findByEmail(normalizedEmail);

    if (!user || !user.is_active) {
      throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id, role: user.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    const firstName = user.first_name || '';
    const lastName = user.last_name || '';

    return {
      token,
      user: {
        id: user.id,
        companyId: user.company_id,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email: user.email,
        role: user.role,
      },
    };
  },

  /**
   * Récupère le profil de l'utilisateur connecté.
   * @param {number} userId
   */
  async getMe(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404, 'NOT_FOUND');
    }

    const firstName = user.first_name || '';
    const lastName = user.last_name || '';

    return {
      id: user.id,
      companyId: user.company_id,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    };
  },
};

module.exports = authService;
