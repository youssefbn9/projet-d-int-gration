'use strict';

const supplierRepository = require('../repositories/supplierRepository');
const AppError = require('../utils/AppError');

const supplierService = {
  async getAll(companyId) {
    return supplierRepository.findAll(companyId);
  },

  async getById(id, companyId) {
    const sup = await supplierRepository.findById(id, companyId);
    if (!sup) throw new AppError('Fournisseur introuvable', 404, 'FOURNISSEUR_INTROUVABLE');
    return sup;
  },

  async create(companyId, fields) {
    const id = await supplierRepository.create({ companyId, ...fields });
    return supplierRepository.findById(id, companyId);
  },

  async update(id, companyId, fields) {
    await this.getById(id, companyId);
    await supplierRepository.update(id, companyId, fields);
    return supplierRepository.findById(id, companyId);
  },

  async remove(id, companyId) {
    await this.getById(id, companyId);
    const productCount = await supplierRepository.countProducts(id, companyId);
    if (productCount > 0) {
      throw new AppError(
        'Impossible de supprimer ce fournisseur car des produits lui sont associés',
        409,
        'SUPPLIER_HAS_PRODUCTS'
      );
    }
    await supplierRepository.remove(id, companyId);
  },
};

module.exports = supplierService;
