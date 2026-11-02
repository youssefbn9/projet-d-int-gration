'use strict';

const customerRepository = require('../repositories/customerRepository');
const AppError = require('../utils/AppError');

const customerService = {
  async getAll(companyId) {
    return customerRepository.findAll(companyId);
  },

  async getById(id, companyId) {
    const cust = await customerRepository.findById(id, companyId);
    if (!cust) throw new AppError('Client introuvable', 404, 'CLIENT_INTROUVABLE');
    return cust;
  },

  async create(companyId, fields) {
    const id = await customerRepository.create({ companyId, ...fields });
    return customerRepository.findById(id, companyId);
  },

  async update(id, companyId, fields) {
    await this.getById(id, companyId);
    await customerRepository.update(id, companyId, fields);
    return customerRepository.findById(id, companyId);
  },

  async remove(id, companyId) {
    await this.getById(id, companyId);
    const salesCount = await customerRepository.countSales(id, companyId);
    if (salesCount > 0) {
      throw new AppError(
        'Impossible de supprimer ce client car des ventes lui sont associées',
        409,
        'CUSTOMER_HAS_SALES'
      );
    }
    await customerRepository.remove(id, companyId);
  },
};

module.exports = customerService;
