// src/routes/creditCard.routes.ts
import { Router } from "express";
import {
  issueCreditCard,
  renewCreditCard,
  payCreditCard,
  authorizeTransaction,
} from "../controllers/creditCard.controller.ts";
import { authMiddleware } from "../middlewares/auth.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CreditCards
 *   description: Credit card management & transactions
 */

/**
 * @swagger
 * /api/credit-cards/issue:
 *   post:
 *     summary: Give a credit card to the user
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bank_account_id:
 *                 type: integer
 *               amex:
 *                 type: boolean
 *                 description: "If true, generates an AMEX (15 digits)"
 *               credit_limit:
 *                 type: number
 *               cut_date:
 *                 type: string
 *               due_date:
 *                 type: string
 *               interest:
 *                 type: number
 *               expiration_date:
 *                 type: string
 *               cardholder_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credit card issued
 *       400:
 *         description: Error
 */
router.post("/issue", authMiddleware, issueCreditCard);

/**
 * @swagger
 * /api/credit-cards/{card_number}/renew:
 *   put:
 *     summary: Renew credit card (new exp date and cvv)
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Credit card number
 *     responses:
 *       200:
 *         description: Credit card renewed
 *       404:
 *         description: Not found
 */
router.put("/:card_number/renew", authMiddleware, renewCreditCard);

/**
 * @swagger
 * /api/credit-cards/{card_number}/pay:
 *   post:
 *     summary: Pay credit card
 *     tags: [CreditCards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Credit card number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               bank_account_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Error
 */
router.post("/:card_number/pay", authMiddleware, payCreditCard);

/**
 * @swagger
 * /api/credit-cards/authorization:
 *   get:
 *     summary: Authorize a credit card transaction (consumption)
 *     tags: [CreditCards]
 *     parameters:
 *       - in: query
 *         name: tarjeta
 *         schema:
 *           type: string
 *         required: true
 *         description: Credit card number
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         required: true
 *         description: Cardholder name
 *       - in: query
 *         name: fecha_venc
 *         schema:
 *           type: string
 *         required: true
 *         description: Expiration date (yyyymm)
 *       - in: query
 *         name: num_seguridad
 *         schema:
 *           type: string
 *         required: true
 *         description: CVV
 *       - in: query
 *         name: monto
 *         schema:
 *           type: number
 *         required: true
 *         description: Amount
 *       - in: query
 *         name: tienda
 *         schema:
 *           type: string
 *         required: true
 *         description: Store
 *       - in: query
 *         name: formato
 *         schema:
 *           type: string
 *         required: false
 *         description: "Format: JSON or XML"
 *     responses:
 *       200:
 *         description: Authorization response (JSON or XML)
 *       400:
 *         description: Error
 */
router.get("/authorization", authorizeTransaction);

export default router;
