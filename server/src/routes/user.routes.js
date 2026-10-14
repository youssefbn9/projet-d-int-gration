'use strict';

const { Router } = require('express');
const { z } = require('zod');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate, requireRole('admin'));

const createSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'staff']).default('staff'),
});

const updateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'staff']),
  isActive: z.boolean().default(true),
});

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Liste des utilisateurs du commerce (admin)
 *     responses:
 *       200: { description: Liste des utilisateurs }
 *   post:
 *     tags: [Utilisateurs]
 *     summary: Créer un utilisateur (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               role: { type: string, enum: [admin, staff] }
 *     responses:
 *       201: { description: Utilisateur créé }
 */
router.get('/', userController.getAll);
router.post('/', validate(createSchema), userController.create);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Utilisateurs]
 *     summary: Détail d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Utilisateur trouvé }
 *       404: { description: Introuvable }
 *   put:
 *     tags: [Utilisateurs]
 *     summary: Modifier un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Utilisateur mis à jour }
 *   delete:
 *     tags: [Utilisateurs]
 *     summary: Supprimer un utilisateur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Utilisateur supprimé }
 */
router.get('/:id', userController.getById);
router.put('/:id', validate(updateSchema), userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
