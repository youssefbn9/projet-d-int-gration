'use strict';

const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion utilisateur
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Connexion réussie }
 *       401: { description: Identifiants invalides }
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Informations de l'utilisateur connecté
 *     responses:
 *       200: { description: Données utilisateur }
 *       401: { description: Non authentifié }
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
