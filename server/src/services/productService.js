'use strict';

const productRepository = require('../repositories/productRepository');
const AppError = require('../utils/AppError');

const productService = {
  async getAll(companyId, filters) {
    return productRepository.findAll(companyId, filters);
  },

  async getById(id, companyId) {
    const product = await productRepository.findById(id, companyId);
    if (!product) throw new AppError('Produit introuvable', 404, 'PRODUIT_INTROUVABLE');
    return product;
  },

  async create(companyId, fields) {
    const id = await productRepository.create({ companyId, ...fields });
    return productRepository.findById(id, companyId);
  },

  async update(id, companyId, fields) {
    await this.getById(id, companyId);
    const affected = await productRepository.update(id, companyId, fields);
    if (!affected) throw new AppError('Mise à jour échouée', 500, 'ERREUR_SERVEUR');
    return productRepository.findById(id, companyId);
  },

  async remove(id, companyId) {
    await this.getById(id, companyId);
    await productRepository.remove(id, companyId);
  },

  async getStockStats(companyId) {
    return productRepository.getStockStats(companyId);
  },
};

module.exports = productService;
