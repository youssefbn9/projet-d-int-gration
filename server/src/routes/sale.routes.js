'use strict';

const { Router } = require('express');
const { z } = require('zod');
const saleController = require('../controllers/saleController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const saleSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'La vente doit contenir au moins un article'),
  note: z.string().optional(),
});

/**
 * @swagger
 * /sales:
 *   get:
 *     tags: [Ventes]
 *     summary: Liste des ventes
 *     responses:
 *       200: { description: Liste des ventes }
 *   post:
 *     tags: [Ventes]
 *     summary: Enregistrer une vente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer }
 *                     quantity: { type: integer }
 *               note: { type: string }
 *     responses:
 *       201: { description: Vente créée }
 *       400: { description: Stock insuffisant }
 */
router.get('/', saleController.getAll);
router.post('/', validate(saleSchema), saleController.create);
router.get('/dashboard', saleController.getDashboard);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     tags: [Ventes]
 *     summary: Détail d'une vente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Vente trouvée }
 *       404: { description: Introuvable }
 */
router.get('/:id', saleController.getById);

module.exports = router;
