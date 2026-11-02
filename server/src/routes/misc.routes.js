'use strict';

const { Router } = require('express');
const { z } = require('zod');
const categoryController = require('../controllers/categoryController');
const supplierController = require('../controllers/supplierController');
const movementController = require('../controllers/movementController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

// ── Catégories ────────────────────────────────────────────────────────────────
const categoryRouter = Router();
categoryRouter.use(authenticate);

const categorySchema = z.object({ name: z.string().min(1, 'Le nom est requis').max(100) });

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Catégories]
 *     summary: Liste des catégories du commerce
 *     responses:
 *       200: { description: Liste des catégories }
 *   post:
 *     tags: [Catégories]
 *     summary: Créer une catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Catégorie créée }
 *       409: { description: Nom déjà utilisé dans ce commerce }
 */
categoryRouter.get('/', categoryController.getAll);
categoryRouter.post('/', requireRole('admin'), validate(categorySchema), categoryController.create);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Catégories]
 *     summary: Modifier une catégorie
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
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200: { description: Catégorie modifiée }
 *       404: { description: Catégorie introuvable }
 *   delete:
 *     tags: [Catégories]
 *     summary: Supprimer une catégorie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Catégorie supprimée }
 *       404: { description: Catégorie introuvable }
 *       409: { description: Catégorie liée à des produits }
 */
categoryRouter.put('/:id', requireRole('admin'), validate(categorySchema), categoryController.update);
categoryRouter.delete('/:id', requireRole('admin'), categoryController.remove);

// ── Fournisseurs ──────────────────────────────────────────────────────────────
const supplierRouter = Router();
supplierRouter.use(authenticate);

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(120),
  email: z.string().email('Format email invalide').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
});

/**
 * @swagger
 * /suppliers:
 *   get:
 *     tags: [Fournisseurs]
 *     summary: Liste des fournisseurs du commerce
 *     responses:
 *       200: { description: Liste des fournisseurs }
 *   post:
 *     tags: [Fournisseurs]
 *     summary: Créer un fournisseur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       201: { description: Fournisseur créé }
 */
supplierRouter.get('/', supplierController.getAll);
supplierRouter.post('/', requireRole('admin'), validate(supplierSchema), supplierController.create);

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     tags: [Fournisseurs]
 *     summary: Consulter un fournisseur par son identifiant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Détails du fournisseur }
 *       404: { description: Fournisseur introuvable }
 *   put:
 *     tags: [Fournisseurs]
 *     summary: Modifier un fournisseur
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
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       200: { description: Fournisseur mis à jour }
 *       404: { description: Fournisseur introuvable }
 *   delete:
 *     tags: [Fournisseurs]
 *     summary: Supprimer un fournisseur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Fournisseur supprimé }
 *       404: { description: Fournisseur introuvable }
 *       409: { description: Fournisseur lié à des produits }
 */
supplierRouter.get('/:id', supplierController.getById);
supplierRouter.put('/:id', requireRole('admin'), validate(supplierSchema), supplierController.update);
supplierRouter.delete('/:id', requireRole('admin'), supplierController.remove);

// ── Mouvements de stock ───────────────────────────────────────────────────────
const movementRouter = Router();
movementRouter.use(authenticate);

const movementSchema = z.object({
  productId: z.number().int().positive(),
  type: z.enum(['entry', 'exit', 'adjustment', 'in', 'out']),
  quantity: z.number().int().min(1),
  reason: z.string().optional(),
});

/**
 * @swagger
 * /movements:
 *   get:
 *     tags: [Stock]
 *     summary: Liste globale paginée des mouvements de stock
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [entry, exit, adjustment, in, out] }
 *     responses:
 *       200: { description: Liste des mouvements }
 *   post:
 *     tags: [Stock]
 *     summary: Enregistrer manuellement un mouvement de stock
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, type, quantity]
 *             properties:
 *               productId: { type: integer }
 *               type: { type: string, enum: [entry, exit, adjustment, in, out] }
 *               quantity: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       201: { description: Mouvement enregistré }
 */
movementRouter.get('/', movementController.getAll);
movementRouter.post('/', validate(movementSchema), movementController.create);

module.exports = { categoryRouter, supplierRouter, movementRouter };
