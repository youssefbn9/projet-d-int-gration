'use strict';

const { Router } = require('express');
const { z } = require('zod');
const customerController = require('../controllers/customerController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const customerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(120),
  email: z.string().email('Format email invalide').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
});

/**
 * @swagger
 * /customers:
 *   get:
 *     tags: [Clients]
 *     summary: Liste des clients du commerce
 *     responses:
 *       200: { description: Liste des clients }
 *   post:
 *     tags: [Clients]
 *     summary: Créer un client
 *     responses:
 *       201: { description: Client créé }
 */
router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.post('/', requireRole('admin'), validate(customerSchema), customerController.create);
router.put('/:id', requireRole('admin'), validate(customerSchema), customerController.update);
router.delete('/:id', requireRole('admin'), customerController.remove);

module.exports = router;

