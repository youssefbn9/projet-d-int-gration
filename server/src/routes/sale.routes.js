'use strict';

const { Router } = require('express');
const { z } = require('zod');
const saleController = require('../controllers/saleController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const createSaleSchema = z.object({
  customerId: z.number().int().positive().nullable().optional(),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive('Identifiant produit invalide'),
        quantity: z.number().int().positive('La quantité doit être un entier positif'),
      })
    )
    .min(1, 'La vente doit contenir au moins un article'),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled'], {
    errorMap: () => ({ message: 'Le statut doit être pending, paid ou cancelled' }),
  }),
});

/**
 * @swagger
 * /sales:
 *   get:
 *     tags: [Ventes]
 *     summary: Liste paginée des ventes avec filtres (status, dateFrom, dateTo)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, paid, cancelled] }
 *       - in: query
 *         name: dateFrom
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dateTo
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: Liste des ventes }
 *   post:
 *     tags: [Ventes]
 *     summary: Enregistrer une vente avec vérification de stock atomique (SELECT FOR UPDATE)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               customerId: { type: integer }
 *               note: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: integer }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201: { description: Vente créée }
 *       409: { description: Stock insuffisant }
 */
router.get('/', saleController.getAll);
router.get('/dashboard', saleController.getDashboard);
router.post('/', validate(createSaleSchema), saleController.create);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     tags: [Ventes]
 *     summary: Détail complet d'une vente avec ses lignes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Détail de la vente }
 *       404: { description: Vente introuvable }
 */
router.get('/:id', saleController.getById);

/**
 * @swagger
 * /sales/{id}/status:
 *   patch:
 *     tags: [Ventes]
 *     summary: Changer le statut d'une vente (pending -> paid, pending/paid -> cancelled avec restitution de stock)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, paid, cancelled] }
 *     responses:
 *       200: { description: Statut mis à jour }
 *       409: { description: Transition non autorisée ou vente déjà annulée }
 */
router.patch('/:id/status', validate(statusSchema), saleController.updateStatus);

module.exports = router;
