'use strict';

const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = Router();

const registerSchema = z.object({
  companyName: z
    .string({ required_error: 'Le nom de l\'entreprise est requis' })
    .trim()
    .min(1, 'Le nom de l\'entreprise ne peut pas être vide'),
  name: z
    .string({ required_error: 'Le nom est requis' })
    .trim()
    .min(1, 'Le nom ne peut pas être vide'),
  email: z
    .string({ required_error: 'L\'email est requis' })
    .trim()
    .email('Format d\'email invalide'),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
    .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'L\'email est requis' })
    .trim()
    .email('Format d\'email invalide'),
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(1, 'Le mot de passe est requis'),
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription d'une entreprise et de son administrateur
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, name, email, password]
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: Ma Boutique
 *               name:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@maboutique.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret123!
 *     responses:
 *       201:
 *         description: Entreprise et compte admin créés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     user: { type: object }
 *       409:
 *         description: Cet email est déjà utilisé (EMAIL_ALREADY_USED)
 *       422:
 *         description: Données invalides (VALIDATION_ERROR)
 */
router.post('/register', validate(registerSchema), authController.register);

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
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@alpha.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin1234!
 *     responses:
 *       200:
 *         description: Connexion réussie, renvoie le token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     user: { type: object }
 *       401:
 *         description: Identifiants invalides (INVALID_CREDENTIALS)
 *       422:
 *         description: Données de validation invalides
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Récupération de l'utilisateur courant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données de l'utilisateur connecté
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       401:
 *         description: Non authentifié (UNAUTHORIZED)
 */
router.get('/me', authMiddleware, authController.me);

module.exports = router;
