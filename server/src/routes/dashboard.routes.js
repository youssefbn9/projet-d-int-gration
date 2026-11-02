'use strict';

const { Router } = require('express');
const saleService = require('../services/saleService');
const authenticate = require('../middleware/authenticate');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistiques complètes pour le tableau de bord
 *     description: Retourne le CA du mois (ventes paid), le nombre de ventes, les produits en stock bas, l'évolution journalière sur 30 jours (zéros inclus) et le top 5 des produits.
 *     responses:
 *       200:
 *         description: Statistiques du tableau de bord
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     monthRevenue: { type: number }
 *                     monthSalesCount: { type: integer }
 *                     lowStockProducts: { type: array }
 *                     salesByDay: { type: array }
 *                     topProducts: { type: array }
 */
router.get('/stats', async (req, res, next) => {
  try {
    const data = await saleService.getDashboardData(req.user.companyId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

