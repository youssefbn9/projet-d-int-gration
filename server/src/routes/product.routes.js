'use strict';

const { Router } = require('express');
const { z } = require('zod');
const productController = require('../controllers/productController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const productSchema = z.object({
  categoryId: z.number().int().positive().nullable().optional(),
  supplierId: z.number().int().positive().nullable().optional(),
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  stockQuantity: z.number().int().min(0).default(0),
  stockMin: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
});

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Produits]
 *     summary: Liste des produits du commerce
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Liste des produits }
 *   post:
 *     tags: [Produits]
 *     summary: Créer un produit (admin)
 *     responses:
 *       201: { description: Produit créé }
 */
router.get('/', productController.getAll);
router.get('/stats', productController.getStats);
router.post('/', requireRole('admin'), validate(productSchema), productController.create);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Produits]
 *     summary: Détail d'un produit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit trouvé }
 *       404: { description: Introuvable }
 *   put:
 *     tags: [Produits]
 *     summary: Modifier un produit (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit mis à jour }
 *   delete:
 *     tags: [Produits]
 *     summary: Supprimer un produit (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Produit supprimé }
 */
router.get('/:id', productController.getById);
router.put('/:id', requireRole('admin'), validate(productSchema), productController.update);
router.delete('/:id', requireRole('admin'), productController.remove);

module.exports = router;
