'use strict';

const { Router } = require('express');
const forecastController = require('../controllers/forecastController');
const authenticate = require('../middleware/authenticate');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /forecast/alerts:
 *   get:
 *     tags: [Prévisions ML]
 *     summary: Liste des produits en risque de rupture imminente (< 7 jours)
 *     description: Calculée via régression linéaire sur les ventes des 30 derniers jours (en une seule requête groupée sans N+1).
 *     responses:
 *       200:
 *         description: Liste des alertes de rupture triée par urgence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product: { type: object }
 *                       avgForecastPerDay: { type: number }
 *                       daysBeforeStockout: { type: number }
 *                       model: { type: object }
 */
router.get('/alerts', forecastController.getAlerts);

/**
 * @swagger
 * /forecast/products/{id}:
 *   get:
 *     tags: [Prévisions ML]
 *     summary: Prévision des ventes sur 7 jours pour un produit spécifique
 *     description: Ajuste un modèle de régression linéaire par moindres carrés sur 30 jours pour projeter les ventes à J+7.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Historique 30 jours, prévisions 7 jours et estimation du délai avant rupture
 *       404:
 *         description: Produit introuvable pour ce commerce (PRODUCT_NOT_FOUND)
 */
router.get('/products/:id', forecastController.getProductForecast);

module.exports = router;
