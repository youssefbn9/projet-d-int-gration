'use strict';

const productRepository = require('../repositories/productRepository');
const categoryRepository = require('../repositories/categoryRepository');
const supplierRepository = require('../repositories/supplierRepository');
const AppError = require('../utils/AppError');

function extractProductFields(data) {
  const price = data.price !== undefined ? parseFloat(data.price) : (data.unitPrice !== undefined ? parseFloat(data.unitPrice) : 0);
  const cost = data.cost !== undefined ? parseFloat(data.cost) : 0;
  const stock = data.stock !== undefined ? parseInt(data.stock, 10) : (data.stockQuantity !== undefined ? parseInt(data.stockQuantity, 10) : 0);
  const minStock = data.min_stock !== undefined ? parseInt(data.min_stock, 10) : (data.stockMin !== undefined ? parseInt(data.stockMin, 10) : 0);

  return {
    name: data.name ? data.name.trim() : '',
    sku: data.sku ? data.sku.trim() : '',
    description: data.description || null,
    unitPrice: isNaN(price) ? 0 : price,
    cost: isNaN(cost) ? 0 : cost,
    stockQuantity: isNaN(stock) ? 0 : stock,
    stockMin: isNaN(minStock) ? 0 : minStock,
    categoryId: data.categoryId ? parseInt(data.categoryId, 10) : null,
    supplierId: data.supplierId ? parseInt(data.supplierId, 10) : null,
    imageUrl: data.imageUrl || null,
  };
}

const productService = {
  async getAll(companyId, filters) {
    return productRepository.findPaginated(companyId, filters);
  },

  async getById(id, companyId) {
    const product = await productRepository.findById(id, companyId);
    if (!product) throw new AppError('Produit introuvable', 404, 'PRODUIT_INTROUVABLE');
    return product;
  },

  async create(companyId, userId, data) {
    const fields = extractProductFields(data);

    // Vérifier unicité du SKU
    const existingSku = await productRepository.findBySku(fields.sku, companyId);
    if (existingSku) {
      throw new AppError('Ce SKU existe déjà pour votre commerce', 409, 'SKU_ALREADY_EXISTS');
    }

    // Vérifier cohérence catégorie
    if (fields.categoryId) {
      const cat = await categoryRepository.findById(fields.categoryId, companyId);
      if (!cat) {
        throw new AppError('La catégorie sélectionnée n\'appartient pas à votre commerce', 422, 'INVALID_CATEGORY');
      }
    }

    // Vérifier cohérence fournisseur
    if (fields.supplierId) {
      const sup = await supplierRepository.findById(fields.supplierId, companyId);
      if (!sup) {
        throw new AppError('Le fournisseur sélectionné n\'appartient pas à votre commerce', 422, 'INVALID_SUPPLIER');
      }
    }

    const productId = await productRepository.createWithInitialStock({
      companyId,
      userId,
      ...fields,
    });

    return productRepository.findById(productId, companyId);
  },

  async update(id, companyId, data) {
    const existing = await this.getById(id, companyId);
    const fields = extractProductFields(data);

    // Vérifier unicité du SKU si modifié
    if (fields.sku.toLowerCase() !== existing.sku.toLowerCase()) {
      const duplicateSku = await productRepository.findBySku(fields.sku, companyId);
      if (duplicateSku && duplicateSku.id !== id) {
        throw new AppError('Ce SKU existe déjà pour votre commerce', 409, 'SKU_ALREADY_EXISTS');
      }
    }

    // Vérifier cohérence catégorie
    if (fields.categoryId) {
      const cat = await categoryRepository.findById(fields.categoryId, companyId);
      if (!cat) {
        throw new AppError('La catégorie sélectionnée n\'appartient pas à votre commerce', 422, 'INVALID_CATEGORY');
      }
    }

    // Vérifier cohérence fournisseur
    if (fields.supplierId) {
      const sup = await supplierRepository.findById(fields.supplierId, companyId);
      if (!sup) {
        throw new AppError('Le fournisseur sélectionné n\'appartient pas à votre commerce', 422, 'INVALID_SUPPLIER');
      }
    }

    await productRepository.update(id, companyId, fields);
    return productRepository.findById(id, companyId);
  },

  async remove(id, companyId) {
    await this.getById(id, companyId);

    const salesCount = await productRepository.countSales(id);
    if (salesCount > 0) {
      throw new AppError(
        'Impossible de supprimer ce produit car des ventes lui sont associées',
        409,
        'PRODUCT_HAS_SALES'
      );
    }

    await productRepository.remove(id, companyId);
  },

  async getStockStats(companyId) {
    return productRepository.getStockStats(companyId);
  },

  async getMovements(productId, companyId, query) {
    const movements = await productRepository.getProductMovements(productId, companyId, query);
    if (!movements) {
      throw new AppError('Produit introuvable', 404, 'PRODUIT_INTROUVABLE');
    }
    return movements;
  },

  async adjustStock(companyId, userId, data) {
    try {
      return await productRepository.adjustStock({ companyId, userId, ...data });
    } catch (err) {
      if (err.code === 'PRODUIT_INTROUVABLE') {
        throw new AppError(err.message, 404, 'PRODUIT_INTROUVABLE');
      }
      if (err.code === 'INSUFFICIENT_STOCK') {
        throw new AppError(err.message, 409, 'INSUFFICIENT_STOCK');
      }
      if (err.code === 'BAD_REQUEST') {
        throw new AppError(err.message, 400, 'BAD_REQUEST');
      }
      throw err;
    }
  },
};

module.exports = productService;
