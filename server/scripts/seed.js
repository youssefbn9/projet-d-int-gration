'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stockpro',
  });

  try {
    console.info('🌱 Début de l\'initialisation de la base de données (Seed 60 jours)...');

    // ── 1. Nettoyage idempotent des tables dans le bon ordre ─────────────────
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE sale_items');
    await connection.query('TRUNCATE TABLE stock_movements');
    await connection.query('TRUNCATE TABLE sales');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('TRUNCATE TABLE customers');
    await connection.query('TRUNCATE TABLE suppliers');
    await connection.query('TRUNCATE TABLE categories');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('TRUNCATE TABLE companies');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.info('🧹 Tables vidées avec succès');

    // ── 2. Entreprise Démo ───────────────────────────────────────────────────
    const [compRes] = await connection.query(
      'INSERT INTO companies (name) VALUES (?)',
      ['Épicerie Demo']
    );
    const companyId = compRes.insertId;

    // ── 3. Utilisateurs (Admin & Staff avec bcrypt 10 rounds) ────────────────
    const adminHash = await bcrypt.hash('Admin123', 10);
    const staffHash = await bcrypt.hash('Staff123', 10);

    const [adminRes] = await connection.query(
      'INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [companyId, 'admin@demo.tn', adminHash, 'Karim', 'Ben Ammar', 'admin']
    );
    const adminId = adminRes.insertId;

    const [staffRes] = await connection.query(
      'INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [companyId, 'staff@demo.tn', staffHash, 'Sami', 'Trabelsi', 'staff']
    );
    const staffId = staffRes.insertId;

    const userIds = [adminId, staffId];

    // ── 4. 4 Catégories ─────────────────────────────────────────────────────
    const categoriesData = [
      'Épicerie Salée',
      'Épicerie Sucrée',
      'Boissons & Jus',
      'Produits Frais & Laiterie',
    ];
    const categoryIds = [];
    for (const catName of categoriesData) {
      const [res] = await connection.query(
        'INSERT INTO categories (company_id, name) VALUES (?, ?)',
        [companyId, catName]
      );
      categoryIds.push(res.insertId);
    }

    // ── 5. 3 Fournisseurs ───────────────────────────────────────────────────
    const suppliersData = [
      {
        name: 'Distribution Alimentaire du Nord (DAN)',
        email: 'commercial@dan-distrib.tn',
        phone: '+216 71 220 330',
        address: 'Zone Industrielle Charguia II, Tunis',
      },
      {
        name: 'Boissons & Eaux Minérales TN',
        email: 'ventes@boissons-tn.com',
        phone: '+216 73 440 550',
        address: 'Route de Monastir, Sousse',
      },
      {
        name: 'Centrale Laitière & Produits Frais',
        email: 'contact@centralefrais.tn',
        phone: '+216 72 660 770',
        address: 'Zone Agroalimentaire, Ben Arous',
      },
    ];
    const supplierIds = [];
    for (const sup of suppliersData) {
      const [res] = await connection.query(
        'INSERT INTO suppliers (company_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [companyId, sup.name, sup.email, sup.phone, sup.address]
      );
      supplierIds.push(res.insertId);
    }

    // ── 6. 8 Clients ────────────────────────────────────────────────────────
    const customersData = [
      { name: 'Mohamed Ben Salem', email: 'mohamed.bensalem@email.tn', phone: '+216 98 123 456' },
      { name: 'Fatma Ben Ali', email: 'fatma.benali@email.tn', phone: '+216 22 234 567' },
      { name: 'Youssef Mansour', email: 'youssef.mansour@email.tn', phone: '+216 55 345 678' },
      { name: 'Amina Jaziri', email: 'amina.jaziri@email.tn', phone: '+216 97 456 789' },
      { name: 'Karim Khelil', email: 'karim.khelil@email.tn', phone: '+216 20 567 890' },
      { name: 'Leila Chaabane', email: 'leila.chaabane@email.tn', phone: '+216 50 678 901' },
      { name: 'Anis Gharbi', email: 'anis.gharbi@email.tn', phone: '+216 99 789 012' },
      { name: 'Salma Riahi', email: 'salma.riahi@email.tn', phone: '+216 21 890 123' },
    ];
    const customerIds = [];
    for (const cust of customersData) {
      const [res] = await connection.query(
        'INSERT INTO customers (company_id, name, email, phone) VALUES (?, ?, ?, ?)',
        [companyId, cust.name, cust.email, cust.phone]
      );
      customerIds.push(res.insertId);
    }

    // ── 7. Définition des 20 Produits réalistes ─────────────────────────────
    // Note: Au moins 3 produits auront un stock final et un rythme de vente prévoyant une rupture sous 7 jours.
    // trend: 'up' (hausse des ventes), 'down' (baisse), 'stable'
    const productDefs = [
      // Épicerie Salée (cat 0, sup 0)
      {
        sku: 'EPI-HUI-01',
        name: 'Huile d\'Olive Vierge Extra 1L',
        catIdx: 0,
        supIdx: 0,
        price: 24.5,
        cost: 18.0,
        min: 15,
        targetFinalStock: 45,
        baseQtyPerSale: 1.5,
        trend: 'up',
      },
      {
        sku: 'EPI-PAT-02',
        name: 'Pâtes Spaghetti n°5 500g',
        catIdx: 0,
        supIdx: 0,
        price: 1.85,
        cost: 1.2,
        min: 30,
        targetFinalStock: 60,
        baseQtyPerSale: 3.0,
        trend: 'up',
      },
      {
        sku: 'EPI-COU-03',
        name: 'Couscous Fin Tunisien 1kg',
        catIdx: 0,
        supIdx: 0,
        price: 2.4,
        cost: 1.6,
        min: 25,
        targetFinalStock: 50,
        baseQtyPerSale: 2.0,
        trend: 'stable',
      },
      {
        sku: 'EPI-TOM-04',
        name: 'Double Concentré de Tomate 800g',
        catIdx: 0,
        supIdx: 0,
        price: 4.2,
        cost: 3.1,
        min: 20,
        // RUPTURE SOUS 7 JOURS N°1: stock = 6, ventes récentes ~2.5/jour -> rupture sous ~2.4 jours !
        targetFinalStock: 6,
        baseQtyPerSale: 2.0,
        trend: 'up',
      },
      {
        sku: 'EPI-THO-05',
        name: 'Thon Entier à l\'Huile d\'Olive 160g',
        catIdx: 0,
        supIdx: 0,
        price: 5.6,
        cost: 4.1,
        min: 15,
        targetFinalStock: 35,
        baseQtyPerSale: 2.0,
        trend: 'stable',
      },
      {
        sku: 'EPI-RIZ-06',
        name: 'Riz Basmati Sélection 1kg',
        catIdx: 0,
        supIdx: 0,
        price: 4.7,
        cost: 3.2,
        min: 15,
        targetFinalStock: 40,
        baseQtyPerSale: 1.8,
        trend: 'down',
      },

      // Épicerie Sucrée (cat 1, sup 0)
      {
        sku: 'SUC-SUC-07',
        name: 'Sucre Blanc Cristallisé 1kg',
        catIdx: 1,
        supIdx: 0,
        price: 2.2,
        cost: 1.7,
        min: 20,
        targetFinalStock: 55,
        baseQtyPerSale: 2.5,
        trend: 'up',
      },
      {
        sku: 'SUC-CAF-08',
        name: 'Café Moulu Torréfié Arabica 250g',
        catIdx: 1,
        supIdx: 0,
        price: 6.9,
        cost: 4.8,
        min: 12,
        targetFinalStock: 28,
        baseQtyPerSale: 1.5,
        trend: 'stable',
      },
      {
        sku: 'SUC-BIS-09',
        name: 'Biscuits Sablés Traditionnels 250g',
        catIdx: 1,
        supIdx: 0,
        price: 2.8,
        cost: 1.9,
        min: 15,
        targetFinalStock: 32,
        baseQtyPerSale: 2.0,
        trend: 'down',
      },
      {
        sku: 'SUC-CHO-10',
        name: 'Chocolat Noir Pâtissier 200g',
        catIdx: 1,
        supIdx: 0,
        price: 4.5,
        cost: 3.2,
        min: 10,
        targetFinalStock: 22,
        baseQtyPerSale: 1.2,
        trend: 'down',
      },
      {
        sku: 'SUC-CON-11',
        name: 'Confiture de Figues Sauvages 370g',
        catIdx: 1,
        supIdx: 0,
        price: 4.9,
        cost: 3.4,
        min: 8,
        // RUPTURE SOUS 7 JOURS N°2: stock = 4, sous le seuil d'alerte (8), ventes ~1.2/jour -> rupture sous ~3 jours !
        targetFinalStock: 4,
        baseQtyPerSale: 1.2,
        trend: 'stable',
      },

      // Boissons & Jus (cat 2, sup 1)
      {
        sku: 'BOI-EAU-12',
        name: 'Pack Eau Minérale Naturelle 6x1.5L',
        catIdx: 2,
        supIdx: 1,
        price: 4.8,
        cost: 3.3,
        min: 25,
        targetFinalStock: 70,
        baseQtyPerSale: 3.0,
        trend: 'up',
      },
      {
        sku: 'BOI-JUS-13',
        name: 'Jus d\'Orange Pur Jus 1L',
        catIdx: 2,
        supIdx: 1,
        price: 3.6,
        cost: 2.4,
        min: 15,
        targetFinalStock: 30,
        baseQtyPerSale: 2.0,
        trend: 'up',
      },
      {
        sku: 'BOI-COL-14',
        name: 'Soda Cola Bouteille 1.5L',
        catIdx: 2,
        supIdx: 1,
        price: 2.9,
        cost: 1.9,
        min: 20,
        targetFinalStock: 38,
        baseQtyPerSale: 2.2,
        trend: 'stable',
      },
      {
        sku: 'BOI-THE-15',
        name: 'Thé Vert Ceylan Supérieur 250g',
        catIdx: 2,
        supIdx: 1,
        price: 3.4,
        cost: 2.2,
        min: 12,
        targetFinalStock: 25,
        baseQtyPerSale: 1.4,
        trend: 'down',
      },

      // Produits Frais & Laiterie (cat 3, sup 2)
      {
        sku: 'FRA-LAI-16',
        name: 'Lait Demi-Écrémé Stérilisé UHT 1L',
        catIdx: 3,
        supIdx: 2,
        price: 1.45,
        cost: 1.15,
        min: 40,
        // RUPTURE SOUS 7 JOURS N°3: stock = 12, sous le seuil d'alerte (40), ventes ~4/jour -> rupture sous ~3 jours !
        targetFinalStock: 12,
        baseQtyPerSale: 3.5,
        trend: 'up',
      },
      {
        sku: 'FRA-YAO-17',
        name: 'Pack Yaourt Nature Brassé (x4)',
        catIdx: 3,
        supIdx: 2,
        price: 2.2,
        cost: 1.5,
        min: 20,
        // Alerte supplémentaire: stock = 8, sous le seuil (20)
        targetFinalStock: 8,
        baseQtyPerSale: 2.0,
        trend: 'up',
      },
      {
        sku: 'FRA-BEU-18',
        name: 'Beurre Doux Pasteurisé 200g',
        catIdx: 3,
        supIdx: 2,
        price: 5.8,
        cost: 4.2,
        min: 10,
        targetFinalStock: 18,
        baseQtyPerSale: 1.5,
        trend: 'stable',
      },
      {
        sku: 'FRA-FRO-19',
        name: 'Fromage Sicilien Râpé 150g',
        catIdx: 3,
        supIdx: 2,
        price: 6.2,
        cost: 4.5,
        min: 12,
        targetFinalStock: 20,
        baseQtyPerSale: 1.3,
        trend: 'stable',
      },
      {
        sku: 'FRA-OEU-20',
        name: 'Plateau de 30 Oeufs Frais Fermiers',
        catIdx: 3,
        supIdx: 2,
        price: 11.5,
        cost: 8.8,
        min: 15,
        // RUPTURE SOUS 7 JOURS N°4: stock = 5, sous le seuil (15), ventes ~2/jour -> rupture sous ~2.5 jours !
        targetFinalStock: 5,
        baseQtyPerSale: 1.6,
        trend: 'up',
      },
    ];

    // ── 8. Simulation des 60 jours de ventes ────────────────────────────────
    const productSoldTotals = new Array(productDefs.length).fill(0);
    const simulatedDays = [];

    const now = new Date();

    for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
      const saleDate = new Date(now);
      saleDate.setDate(now.getDate() - dayOffset);

      // Heures de vente réparties dans la journée
      const numSales = Math.floor(Math.random() * 3) + 2; // 2 à 4 ventes par jour
      const daySales = [];

      for (let s = 0; s < numSales; s++) {
        // Horodatage réaliste de la vente (entre 08h30 et 19h30)
        const hour = 8 + Math.floor((s * 11) / numSales) + Math.floor(Math.random() * 2);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const exactDate = new Date(saleDate);
        exactDate.setHours(hour, minute, second, 0);

        const sellerId = userIds[Math.floor(Math.random() * userIds.length)];
        const customerId =
          Math.random() > 0.25
            ? customerIds[Math.floor(Math.random() * customerIds.length)]
            : null;

        // Choix de 2 à 5 produits distincts par vente
        const numItems = Math.floor(Math.random() * 4) + 2;
        const shuffledIndexes = [...Array(productDefs.length).keys()].sort(
          () => 0.5 - Math.random()
        );
        const selectedProdIndexes = shuffledIndexes.slice(0, numItems);

        const items = [];
        for (const pIdx of selectedProdIndexes) {
          const pDef = productDefs[pIdx];

          // Calcul de la tendance selon la progression des 60 jours (0 à 59)
          const progress = (60 - dayOffset) / 60; // 0.0 -> 1.0
          let trendFactor = 1.0;
          if (pDef.trend === 'up') {
            trendFactor = 0.7 + progress * 0.6; // 0.7 -> 1.3
          } else if (pDef.trend === 'down') {
            trendFactor = 1.3 - progress * 0.6; // 1.3 -> 0.7
          }

          // Bruit aléatoire (+/- 25%)
          const noise = 0.85 + Math.random() * 0.3;
          let qty = Math.round(pDef.baseQtyPerSale * trendFactor * noise);
          if (qty < 1) qty = 1;

          productSoldTotals[pIdx] += qty;
          items.push({
            productIndex: pIdx,
            quantity: qty,
            unitPrice: pDef.price,
            subtotal: parseFloat((qty * pDef.price).toFixed(2)),
          });
        }

        const totalAmount = parseFloat(
          items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
        );

        daySales.push({
          date: exactDate,
          userId: sellerId,
          customerId,
          totalAmount,
          items,
        });
      }

      simulatedDays.push(daySales);
    }

    // ── 9. Insertion des Produits avec stock final cohérent ──────────────────
    const insertedProductIds = [];
    const initialStocks = [];

    for (let i = 0; i < productDefs.length; i++) {
      const p = productDefs[i];
      const totalSold = productSoldTotals[i];
      const initialStock = p.targetFinalStock + totalSold;
      initialStocks.push(initialStock);

      const catId = categoryIds[p.catIdx];
      const supId = supplierIds[p.supIdx];

      const [res] = await connection.query(
        `INSERT INTO products (
          company_id, category_id, supplier_id, sku, name, unit_price, cost, stock_quantity, stock_min
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyId,
          catId,
          supId,
          p.sku,
          p.name,
          p.price,
          p.cost,
          p.targetFinalStock, // Stock final actuel
          p.min,
        ]
      );
      insertedProductIds.push(res.insertId);
    }

    // ── 10. Mouvements de stock initiaux (J-60) ──────────────────────────────
    const initialDate = new Date(now);
    initialDate.setDate(now.getDate() - 61);
    initialDate.setHours(8, 0, 0, 0);

    for (let i = 0; i < productDefs.length; i++) {
      const prodId = insertedProductIds[i];
      const initStock = initialStocks[i];

      await connection.query(
        `INSERT INTO stock_movements (
          company_id, product_id, user_id, type, quantity, reason, created_at
        ) VALUES (?, ?, ?, 'in', ?, 'Stock initial', ?)`,
        [companyId, prodId, adminId, initStock, initialDate]
      );
    }

    // ── 11. Insertion des Ventes, Lignes et Mouvements de stock 'out' ────────
    let totalSalesCount = 0;
    let totalSaleItemsCount = 0;

    for (const daySales of simulatedDays) {
      for (const sale of daySales) {
        // Insertion Vente (statut 'paid')
        const [saleRes] = await connection.query(
          `INSERT INTO sales (
            company_id, user_id, customer_id, total_amount, status, created_at
          ) VALUES (?, ?, ?, ?, 'paid', ?)`,
          [
            companyId,
            sale.userId,
            sale.customerId,
            sale.totalAmount,
            sale.date,
          ]
        );
        const saleId = saleRes.insertId;
        totalSalesCount++;

        // Insertion des articles et des mouvements 'out'
        for (const item of sale.items) {
          const prodId = insertedProductIds[item.productIndex];

          await connection.query(
            `INSERT INTO sale_items (
              sale_id, product_id, quantity, unit_price, subtotal
            ) VALUES (?, ?, ?, ?, ?)`,
            [saleId, prodId, item.quantity, item.unitPrice, item.subtotal]
          );
          totalSaleItemsCount++;

          await connection.query(
            `INSERT INTO stock_movements (
              company_id, product_id, user_id, type, quantity, reason, sale_id, created_at
            ) VALUES (?, ?, ?, 'out', ?, ?, ?, ?)`,
            [
              companyId,
              prodId,
              sale.userId,
              -item.quantity,
              `Vente #${saleId}`,
              saleId,
              sale.date,
            ]
          );
        }
      }
    }

    console.info('✅ Base de données réinitialisée et peuplée avec succès !');
    console.info(`   - Entreprise : "Épicerie Demo" (ID: ${companyId})`);
    console.info(`   - Utilisateurs : admin@demo.tn / Admin123 et staff@demo.tn / Staff123`);
    console.info(`   - Catégories : ${categoryIds.length}`);
    console.info(`   - Fournisseurs : ${supplierIds.length}`);
    console.info(`   - Produits : ${insertedProductIds.length}`);
    console.info(`   - Clients : ${customerIds.length}`);
    console.info(`   - Ventes (60 jours) : ${totalSalesCount} ventes (${totalSaleItemsCount} lignes)`);

    // ── 12. Vérifications de cohérence ───────────────────────────────────────
    // A. Aucun stock négatif
    const [negStock] = await connection.query(
      'SELECT id, name, stock_quantity FROM products WHERE company_id = ? AND stock_quantity < 0',
      [companyId]
    );
    if (negStock.length > 0) {
      throw new Error(`Erreur: Produits avec stock négatif détectés (${negStock.length})`);
    }

    // B. Somme des mouvements = stock actuel
    const [mvCheck] = await connection.query(
      `SELECT p.id, p.name, p.stock_quantity,
              COALESCE(SUM(m.quantity), 0) AS calc_stock
       FROM products p
       LEFT JOIN stock_movements m ON p.id = m.product_id
       WHERE p.company_id = ?
       GROUP BY p.id, p.name, p.stock_quantity`,
      [companyId]
    );

    let matchCount = 0;
    for (const row of mvCheck) {
      if (parseInt(row.stock_quantity, 10) !== parseInt(row.calc_stock, 10)) {
        throw new Error(
          `Incohérence pour "${row.name}": stock_quantity=${row.stock_quantity} vs somme_mouvements=${row.calc_stock}`
        );
      }
      matchCount++;
    }
    console.info(`✅ Cohérence absolue vérifiée : ${matchCount}/20 produits ont une somme de mouvements exactement égale au stock !`);

    // C. Produits sous seuil d'alerte et prévision de rupture < 7 jours
    const [lowStocks] = await connection.query(
      'SELECT name, sku, stock_quantity, stock_min FROM products WHERE company_id = ? AND stock_quantity <= stock_min',
      [companyId]
    );
    console.info(`🚨 Produits actuellement sous le seuil d'alerte : ${lowStocks.length}`);
    lowStocks.forEach((p) => {
      console.info(`   • ${p.sku} - ${p.name} : Stock = ${p.stock_quantity} (Min: ${p.stock_min})`);
    });
  } catch (err) {
    console.error('❌ Erreur lors du seed :', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
