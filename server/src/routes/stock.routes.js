'use strict';

const { Router } = require('express');
const { z } = require('zod');
const productService = require('../services/productService');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const adjustSchema = z.object({
  productId: z.number().int().positive('Identifiant produit invalide'),
  type: z.enum(['in', 'out', 'adjustment'], {
    errorMap: () => ({ message: "Le type doit être 'in', 'out' ou 'adjustment'" }),
  }),
  quantity: z.number().int('La quantité doit être un entier'),
  reason: z.string().optional().nullable().or(z.literal('')),
});

/**
 * @swagger
 * /stock/adjust:
 *   post:
 *     tags: [Stock]
 *     summary: Ajuster le stock d'un produit (in, out, adjustment) en transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, type, quantity]
 *             properties:
 *               productId: { type: integer }
 *               type: { type: string, enum: [in, out, adjustment] }
 *               quantity: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Stock ajusté et mouvement créé }
 *       404: { description: Produit introuvable }
 *       409: { description: Stock insuffisant pour une sortie }
 */
router.post('/adjust', validate(adjustSchema), async (req, res, next) => {
  try {
    const result = await productService.adjustStock(
      req.user.companyId,
      req.user.userId,
      req.body
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

