'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

const authService = {
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.is_active) {
      throw new AppError('Email ou mot de passe incorrect', 401, 'CREDENTIALS_INVALIDES');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401, 'CREDENTIALS_INVALIDES');
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
      },
    };
  },

  async hashPassword(plainText) {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  },
};

module.exports = authService;
