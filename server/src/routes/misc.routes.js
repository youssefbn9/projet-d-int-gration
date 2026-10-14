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

const categorySchema = z.object({ name: z.string().min(1).max(100) });

categoryRouter.get('/', categoryController.getAll);
categoryRouter.post('/', requireRole('admin'), validate(categorySchema), categoryController.create);
categoryRouter.put('/:id', requireRole('admin'), validate(categorySchema), categoryController.update);
categoryRouter.delete('/:id', requireRole('admin'), categoryController.remove);

// ── Fournisseurs ──────────────────────────────────────────────────────────────
const supplierRouter = Router();
supplierRouter.use(authenticate);

const supplierSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().optional().nullable(),
});

supplierRouter.get('/', supplierController.getAll);
supplierRouter.get('/:id', supplierController.getById);
supplierRouter.post('/', requireRole('admin'), validate(supplierSchema), supplierController.create);
supplierRouter.put('/:id', requireRole('admin'), validate(supplierSchema), supplierController.update);
supplierRouter.delete('/:id', requireRole('admin'), supplierController.remove);

// ── Mouvements de stock ───────────────────────────────────────────────────────
const movementRouter = Router();
movementRouter.use(authenticate);

const movementSchema = z.object({
  productId: z.number().int().positive(),
  type: z.enum(['entry', 'exit', 'adjustment']),
  quantity: z.number().int().min(1),
  reason: z.string().optional(),
});

movementRouter.get('/', movementController.getAll);
movementRouter.post('/', validate(movementSchema), movementController.create);

module.exports = { categoryRouter, supplierRouter, movementRouter };
