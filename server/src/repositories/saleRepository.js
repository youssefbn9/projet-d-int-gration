'use strict';

const pool = require('../config/db');

const saleRepository = {
  /**
   * Crée une vente et ses lignes dans une transaction avec SELECT FOR UPDATE
   */
  async createWithItems(companyId, userId, { customerId, items, note }) {
    // 1. Fusionner les produits distincts en sommant les quantités
    const itemMap = new Map();
    for (const item of items) {
      const pid = parseInt(item.productId, 10);
      const qty = parseInt(item.quantity, 10);
      if (qty > 0) {
        itemMap.set(pid, (itemMap.get(pid) || 0) + qty);
      }
    }
    const mergedItems = Array.from(itemMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    if (mergedItems.length === 0) {
      throw Object.assign(new Error('La vente doit contenir au moins un article avec une quantité valide'), {
        code: 'VENTE_VIDE',
        status: 400,
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Vérifier le client s'il est spécifié
      if (customerId) {
        const [custRows] = await conn.query(
          'SELECT id, name FROM customers WHERE id = ? AND company_id = ? LIMIT 1',
          [customerId, companyId]
        );
        if (!custRows[0]) {
          throw Object.assign(new Error('Client introuvable pour ce commerce'), {
            code: 'CLIENT_INTROUVABLE',
            status: 404,
          });
        }
      }

      // Verrouiller les produits concernés avec FOR UPDATE et vérifier le stock
      const lockedProducts = new Map();
      for (const item of mergedItems) {
        const [prodRows] = await conn.query(
          'SELECT id, name, sku, stock_quantity, unit_price FROM products WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
          [item.productId, companyId]
        );
        const product = prodRows[0];
        if (!product) {
          throw Object.assign(new Error(`Produit ${item.productId} introuvable pour votre commerce`), {
            code: 'PRODUIT_INTROUVABLE',
            status: 404,
          });
        }

        if (product.stock_quantity < item.quantity) {
          throw Object.assign(
            new Error(
              `Stock insuffisant pour le produit "${product.name}" (${product.stock_quantity} disponible(s), ${item.quantity} demandé(s))`
            ),
            { code: 'INSUFFICIENT_STOCK', status: 409 }
          );
        }

        lockedProducts.set(item.productId, product);
      }

      // 2. Insérer la vente avec statut 'pending'
      const [saleResult] = await conn.query(
        'INSERT INTO sales (company_id, user_id, customer_id, total_amount, status, note) VALUES (?, ?, ?, 0, \'pending\', ?)',
        [companyId, userId, customerId || null, note || null]
      );
      const saleId = saleResult.insertId;

      let calculatedTotal = 0;

      // 3. Insérer les lignes, décrémenter le stock et créer les mouvements 'out'
      for (const item of mergedItems) {
        const product = lockedProducts.get(item.productId);
        const unitPrice = parseFloat(product.unit_price) || 0;
        const subtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
        calculatedTotal += subtotal;

        await conn.query(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [saleId, item.productId, item.quantity, unitPrice, subtotal]
        );

        await conn.query(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND company_id = ?',
          [item.quantity, item.productId, companyId]
        );

        await conn.query(
          'INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason, sale_id) VALUES (?, ?, ?, \'out\', ?, ?, ?)',
          [companyId, item.productId, userId, -item.quantity, `Vente #${saleId}`, saleId]
        );
      }

      // 4. Mettre à jour le total calculé côté serveur
      await conn.query(
        'UPDATE sales SET total_amount = ? WHERE id = ? AND company_id = ?',
        [calculatedTotal.toFixed(2), saleId, companyId]
      );

      await conn.commit();
      return saleId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Liste paginée des ventes avec filtres
   */
  async findAll(companyId, { status, dateFrom, dateTo, page = 1, limit = 50 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (pageNum - 1) * limitNum;

    let whereSql = ' WHERE s.company_id = ?';
    const params = [companyId];

    if (status) {
      whereSql += ' AND s.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      whereSql += ' AND s.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereSql += ' AND s.created_at <= ?';
      params.push(dateTo.includes(' ') ? dateTo : `${dateTo} 23:59:59`);
    }

    // Compte total
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM sales s ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Données avec jointures client et vendeur
    const dataSql = `
      SELECT s.*,
             u.first_name, u.last_name,
             CONCAT(u.first_name, ' ', u.last_name) AS user_name,
             c.name AS customer_name,
             c.email AS customer_email,
             COUNT(si.id) AS item_count
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereSql}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

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

  /**
   * Détail d'une vente avec ses lignes et noms de produits
   */
  async findById(id, companyId) {
    const [sales] = await pool.query(
      `SELECT s.*,
              u.first_name, u.last_name,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name,
              c.name AS customer_name,
              c.email AS customer_email,
              c.phone AS customer_phone
       FROM sales s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ? AND s.company_id = ? LIMIT 1`,
      [id, companyId]
    );
    if (!sales[0]) return null;

    const [items] = await pool.query(
      `SELECT si.*, p.name AS product_name, p.sku
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [id]
    );
    return { ...sales[0], items };
  },

  /**
   * Mise à jour du statut avec restitution du stock en cas d'annulation
   */
  async updateStatus(id, companyId, userId, newStatus) {
    const validStatuses = ['pending', 'paid', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw Object.assign(new Error('Statut invalide'), {
        code: 'INVALID_STATUS',
        status: 400,
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Verrouiller la vente
      const [sales] = await conn.query(
        'SELECT * FROM sales WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
        [id, companyId]
      );
      const sale = sales[0];
      if (!sale) {
        throw Object.assign(new Error('Vente introuvable pour votre commerce'), {
          code: 'VENTE_INTROUVABLE',
          status: 404,
        });
      }

      const currentStatus = sale.status;

      // Transitions autorisées :
      // pending -> paid
      // pending -> cancelled
      // paid -> cancelled
      const isAllowed =
        (currentStatus === 'pending' && (newStatus === 'paid' || newStatus === 'cancelled')) ||
        (currentStatus === 'paid' && newStatus === 'cancelled');

      if (!isAllowed) {
        throw Object.assign(
          new Error(`Transition de statut non autorisée de "${currentStatus}" vers "${newStatus}"`),
          { code: 'INVALID_STATUS_TRANSITION', status: 409 }
        );
      }

      // Si passage à cancelled : restituer le stock et créer les mouvements 'in'
      if (newStatus === 'cancelled') {
        const [items] = await conn.query(
          'SELECT product_id, quantity FROM sale_items WHERE sale_id = ?',
          [id]
        );

        for (const item of items) {
          // Verrouiller le produit
          await conn.query(
            'SELECT id, stock_quantity FROM products WHERE id = ? AND company_id = ? LIMIT 1 FOR UPDATE',
            [item.product_id, companyId]
          );

          // Restituer le stock
          await conn.query(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? AND company_id = ?',
            [item.quantity, item.product_id, companyId]
          );

          // Créer le mouvement de stock 'in'
          await conn.query(
            'INSERT INTO stock_movements (company_id, product_id, user_id, type, quantity, reason, sale_id) VALUES (?, ?, ?, \'in\', ?, ?, ?)',
            [companyId, item.product_id, userId, item.quantity, `Annulation vente #${id}`, id]
          );
        }
      }

      // Mettre à jour le statut
      await conn.query('UPDATE sales SET status = ? WHERE id = ? AND company_id = ?', [
        newStatus,
        id,
        companyId,
      ]);

      await conn.commit();
      return this.findById(id, companyId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Statistiques Dashboard
   */
  async getDashboardStats(companyId) {
    // 1. Chiffre d'affaires et nombre de ventes du mois en cours (statut 'paid' ou 'completed')
    const [monthRows] = await pool.query(
      `SELECT
         COALESCE(SUM(total_amount), 0) AS monthRevenue,
         COUNT(*) AS monthSalesCount
       FROM sales
       WHERE company_id = ?
         AND (status = 'paid' OR status = 'completed')
         AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      [companyId]
    );

    const monthRevenue = parseFloat(monthRows[0]?.monthRevenue) || 0;
    const monthSalesCount = parseInt(monthRows[0]?.monthSalesCount, 10) || 0;

    // 2. Produits en stock faible (stock <= min_stock, limit 10)
    const [lowStockProducts] = await pool.query(
      `SELECT p.id, p.name, p.sku, p.unit_price, p.stock_quantity, p.stock_min, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.company_id = ? AND p.stock_quantity <= p.stock_min
       ORDER BY p.stock_quantity ASC
       LIMIT 10`,
      [companyId]
    );

    // 3. Ventes par jour sur les 30 derniers jours (avec zéros inclus)
    const [dailySalesRows] = await pool.query(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
         COALESCE(SUM(total_amount), 0) AS total,
         COUNT(*) AS count
       FROM sales
       WHERE company_id = ?
         AND (status = 'paid' OR status = 'completed')
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')`,
      [companyId]
    );

    const salesMap = new Map();
    for (const row of dailySalesRows) {
      salesMap.set(row.date, {
        total: parseFloat(row.total) || 0,
        count: parseInt(row.count, 10) || 0,
      });
    }

    const salesByDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const record = salesMap.get(dateStr) || { total: 0, count: 0 };
      salesByDay.push({
        date: dateStr,
        total: record.total,
        count: record.count,
      });
    }

    // 4. Top 5 des produits sur 30 jours
    const [topProducts] = await pool.query(
      `SELECT p.id, p.name,
              COALESCE(SUM(si.quantity), 0) AS total_qty,
              COALESCE(SUM(si.subtotal), 0) AS total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.company_id = ?
         AND (s.status = 'paid' OR s.status = 'completed')
         AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY p.id, p.name
       ORDER BY total_qty DESC
       LIMIT 5`,
      [companyId]
    );

    return {
      monthRevenue,
      monthSalesCount,
      lowStockProducts,
      salesByDay,
      topProducts,
    };
  },
};

module.exports = saleRepository;
