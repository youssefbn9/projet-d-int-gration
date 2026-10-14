'use strict';

const categoryRepository = require('../repositories/categoryRepository');
const AppError = require('../utils/AppError');

const categoryService = {
  async getAll(companyId) {
    return categoryRepository.findAll(companyId);
  },

  async getById(id, companyId) {
    const cat = await categoryRepository.findById(id, companyId);
    if (!cat) throw new AppError('Catégorie introuvable', 404, 'CATEGORIE_INTROUVABLE');
    return cat;
  },

  async create(companyId, name) {
    const id = await categoryRepository.create(companyId, name);
    return categoryRepository.findById(id, companyId);
  },

  async update(id, companyId, name) {
    await this.getById(id, companyId);
    await categoryRepository.update(id, companyId, name);
    return categoryRepository.findById(id, companyId);
  },

  async remove(id, companyId) {
    await this.getById(id, companyId);
    await categoryRepository.remove(id, companyId);
  },
};

module.exports = categoryService;
