'use strict';

const pool = require('../config/db');

function formatProductRow(p) {
  if (!p) return null;
  const unitPrice = parseFloat(p.unit_price) || 0;
  const cost = parseFloat(p.cost) || 0;
  const stockQty = parseInt(p.stock_quantity, 10) || 0;
  const stockMin = parseInt(p.stock_min, 10) || 0;

  return {
    ...p,
    unit_price: unitPrice,
    price: unitPrice,
    cost,
    stock_quantity: stockQty,
    stock: stockQty,
    stock_min: stockMin,
    min_stock: stockMin,
  };
}

const productRepository = {
  /**
   * Liste paginée des produits avec filtres
   */
  async findPaginated(companyId, { search, categoryId, lowStock, page = 1, limit = 10 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    let whereSql = ' WHERE p.company_id = ?';
    const params = [companyId];

    if (search && search.trim()) {
      whereSql += ' AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.sku) LIKE LOWER(?))';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (categoryId) {
      whereSql += ' AND p.category_id = ?';
      params.push(parseInt(categoryId, 10));
    }

    if (lowStock === true || lowStock === 'true' || lowStock === '1' || lowStock === 1) {
      whereSql += ' AND p.stock_quantity <= p.stock_min';
    }

    // Compte total
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Données paginées
    const dataSql = `
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s  ON p.supplier_id  = s.id
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);
    const items = rows.map(formatProductRow);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  },

  async findById(id, companyId) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, s.name AS supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s  ON p.supplier_id  = s.id
       WHERE p.id = ? AND p.company_id = ? LIMIT 1`,
      [id, companyId]
    );
    return formatProductRow(rows[0]);
  },

  async findBySku(sku, companyId) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE LOWER(sku) = LOWER(?) AND company_id = ? LIMIT 1',
      [sku.trim(), companyId]
    );
    return formatProductRow(rows[0]);
  },

  async countSales(id) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM sale_items WHERE product_id = ?',
      [id]
    );
    return rows[0]?.count || 0;
  },

  /**
   * Création avec mouvement de stock initial dans la même transaction
   */
  async createWithInitialStock({ companyId, userId, categoryId, supplierId, sku, name, description, unitPrice, cost, stockQuantity, stockMin, imageUrl }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [res] = await conn.query(
        `INSERT INTO products (company_id, category_id, supplier_id, sku, name, description, unit_price, cost, stock_quantity, stock_min, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyId,
          categoryId || null,
          supplierId || null,
          sku.trim(),
          name.trim(),
          description || null,
          unitPrice,
          cost || 0,
          stockQuantity,
          stockMin,
          imageUrl || null,
        ]
      );
      const productId = res.insertId;

      if (stockQuantity > 0) {
        await conn.query(
          `INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason)
           VALUES (?, ?, ?, 'in', ?, 'Stock initial')`,
          [companyId, productId, userId, stockQuantity]
        );
      }

      await conn.commit();
      return productId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async update(id, companyId, fields) {
    const [result] = await pool.query(
      `UPDATE products
       SET category_id=?, supplier_id=?, sku=?, name=?, description=?, unit_price=?, cost=?, stock_quantity=?, stock_min=?, image_url=?
       WHERE id=? AND company_id=?`,
      [
        fields.categoryId || null,
        fields.supplierId || null,
        fields.sku.trim(),
        fields.name.trim(),
        fields.description || null,
        fields.unitPrice,
        fields.cost || 0,
        fields.stockQuantity,
        fields.stockMin,
        fields.imageUrl || null,
        id,
        companyId,
      ]
    );
    return result.affectedRows;
  },

  async remove(id, companyId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Supprimer les mouvements de stock associés s'il n'y a pas de vente
      await conn.query('DELETE FROM stock_movements WHERE product_id = ? AND company_id = ?', [id, companyId]);
      const [res] = await conn.query('DELETE FROM products WHERE id = ? AND company_id = ?', [id, companyId]);
      await conn.commit();
      return res.affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** Historique paginé des mouvements d'un produit */
  async getProductMovements(productId, companyId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    // Vérifier l'existence du produit dans le commerce
    const prod = await this.findById(productId, companyId);
    if (!prod) return null;

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM stock_movements WHERE product_id = ? AND company_id = ?',
      [productId, companyId]
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const [rows] = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) AS user_name
       FROM stock_movements m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.product_id = ? AND m.company_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, companyId, limitNum, offset]
    );

    return {
      items: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  },

  /** Ajustement de stock en transaction avec SELECT FOR UPDATE */
  async adjustStock({ companyId, userId, productId, type, quantity, reason }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [prodRows] = await conn.query(
        'SELECT id, name, stock_quantity FROM products WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
        [productId, companyId]
      );
      const product = prodRows[0];
      if (!product) {
        throw Object.assign(new Error('Produit introuvable pour votre commerce'), {
          code: 'PRODUIT_INTROUVABLE',
          status: 404,
        });
      }

      const currentStock = parseInt(product.stock_quantity, 10);
      const qty = parseInt(quantity, 10);
      let newStock = currentStock;
      let delta = 0;

      if (type === 'in') {
        if (qty <= 0) {
          throw Object.assign(new Error('La quantité doit être supérieure à 0'), {
            code: 'BAD_REQUEST',
            status: 400,
          });
        }
        newStock = currentStock + qty;
        delta = qty;
      } else if (type === 'out') {
        if (qty <= 0) {
          throw Object.assign(new Error('La quantité doit être supérieure à 0'), {
            code: 'BAD_REQUEST',
            status: 400,
          });
        }
        newStock = currentStock - qty;
        if (newStock < 0) {
          throw Object.assign(
            new Error(`Stock insuffisant pour effectuer cette sortie (${currentStock} disponible(s))`),
            { code: 'INSUFFICIENT_STOCK', status: 409 }
          );
        }
        delta = -qty;
      } else if (type === 'adjustment') {
        if (qty < 0) {
          throw Object.assign(new Error('Le stock ajusté ne peut pas être négatif'), {
            code: 'BAD_REQUEST',
            status: 400,
          });
        }
        newStock = qty;
        delta = newStock - currentStock;
      } else {
        throw Object.assign(new Error('Type de mouvement invalide'), {
          code: 'BAD_REQUEST',
          status: 400,
        });
      }

      await conn.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ? AND company_id = ?',
        [newStock, productId, companyId]
      );

      const [mvResult] = await conn.query(
        'INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason) VALUES (?, ?, ?, ?, ?, ?)',
        [companyId, productId, userId, type, delta, reason || 'Ajustement de stock']
      );

      await conn.commit();
      return {
        movementId: mvResult.insertId,
        productId,
        productName: product.name,
        previousStock: currentStock,
        newStock,
        type,
        quantity: delta,
        reason,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /** Statistiques de stock pour le dashboard */
  async getStockStats(companyId) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_products,
         COALESCE(SUM(stock_quantity), 0) AS total_stock,
         COALESCE(SUM(CASE WHEN stock_quantity <= stock_min THEN 1 ELSE 0 END), 0) AS low_stock_count,
         COALESCE(SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count,
         COALESCE(SUM(stock_quantity * unit_price), 0) AS stock_value
       FROM products WHERE company_id = ?`,
      [companyId]
    );
    return rows[0];
  },
};

module.exports = productRepository;
