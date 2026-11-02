'use strict';

const { Router } = require('express');
const { z } = require('zod');
const productController = require('../controllers/productController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const productSchema = z
  .object({
    name: z.string().min(1, 'Le nom est requis').max(200),
    sku: z.string().min(1, 'Le SKU est requis').max(80),
    price: z.number().nonnegative('Le prix doit être positif ou nul').optional(),
    unitPrice: z.number().nonnegative('Le prix doit être positif ou nul').optional(),
    cost: z.number().nonnegative('Le coût doit être positif ou nul').optional().default(0),
    stock: z.number().int().min(0, 'Le stock doit être un entier positif ou nul').optional(),
    stockQuantity: z.number().int().min(0, 'Le stock doit être un entier positif ou nul').optional(),
    min_stock: z.number().int().min(0, 'Le seuil doit être un entier positif ou nul').optional(),
    stockMin: z.number().int().min(0, 'Le seuil doit être un entier positif ou nul').optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    supplierId: z.number().int().positive().nullable().optional(),
    description: z.string().optional().nullable().or(z.literal('')),
    imageUrl: z.string().optional().nullable().or(z.literal('')),
  })
  .refine(
    (data) => data.price !== undefined || data.unitPrice !== undefined,
    {
      message: 'Le prix est requis',
      path: ['price'],
    }
  );

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Produits]
 *     summary: Liste paginée des produits du commerce
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche par nom ou SKU
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *         description: Filtrer par identifiant de catégorie
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *         description: Filtrer par stock faible (stock <= seuil)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Liste des produits paginée (items + pagination) }
 *   post:
 *     tags: [Produits]
 *     summary: Créer un produit (admin)
 *     responses:
 *       201: { description: Produit créé }
 *       409: { description: SKU déjà existant }
 *       422: { description: Catégorie ou Fournisseur invalide pour ce commerce }
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
 *       404: { description: Introuvable }
 *       409: { description: SKU déjà existant }
 *       422: { description: Catégorie ou Fournisseur invalide }
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
 *       404: { description: Introuvable }
 *       409: { description: Produit lié à des ventes }
 */
router.get('/:id', productController.getById);

/**
 * @swagger
 * /products/{id}/movements:
 *   get:
 *     tags: [Produits]
 *     summary: Historique paginé des mouvements d'un produit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Liste des mouvements du produit }
 *       404: { description: Produit introuvable }
 */
router.get('/:id/movements', productController.getMovements);
router.put('/:id', requireRole('admin'), validate(productSchema), productController.update);
router.delete('/:id', requireRole('admin'), productController.remove);

module.exports = router;
