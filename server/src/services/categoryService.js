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
    const trimmed = name.trim();
    const existing = await categoryRepository.findByName(trimmed, companyId);
    if (existing) {
      throw new AppError('Une catégorie avec ce nom existe déjà', 409, 'CATEGORY_ALREADY_EXISTS');
    }
    const id = await categoryRepository.create(companyId, trimmed);
    return categoryRepository.findById(id, companyId);
  },

  async update(id, companyId, name) {
    await this.getById(id, companyId);
    const trimmed = name.trim();
    const existing = await categoryRepository.findByName(trimmed, companyId);
    if (existing && existing.id !== id) {
      throw new AppError('Une catégorie avec ce nom existe déjà', 409, 'CATEGORY_ALREADY_EXISTS');
    }
    await categoryRepository.update(id, companyId, trimmed);
    return categoryRepository.findById(id, companyId);
  },

  async remove(id, companyId) {
    await this.getById(id, companyId);
    const productCount = await categoryRepository.countProducts(id, companyId);
    if (productCount > 0) {
      throw new AppError(
        'Impossible de supprimer cette catégorie car des produits y sont associés',
        409,
        'CATEGORY_HAS_PRODUCTS'
      );
    }
    await categoryRepository.remove(id, companyId);
  },
};

module.exports = categoryService;
