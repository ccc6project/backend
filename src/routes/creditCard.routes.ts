// src/routes/creditCard.routes.ts
import { Router } from "express";
import {
  issueCreditCard,
  renewCreditCard,
  payCreditCard,
  authorizeTransaction,
  updateCreditCard,
  updateCreditCardStatus,
  softDeleteCreditCard,
  listUserCreditCards,
  getCardStatement,
  getCardTransactions,
} from "../controllers/creditCard.controller.ts";
import { authMiddleware } from "../middlewares/auth.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TarjetaCredito
 *   description: Mantenimiento Tarjetas de Credito y Transacciones
 */

/**
 * @swagger
 * /api/tarjeta-credito/emitir:
 *   post:
 *     summary: Generar Tarjeta de Credito al usuario
 *     tags: [TarjetaCredito]
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
 *         description: Tarjeta de credito emitida
 *       400:
 *         description: Error
 */
router.post("/emitir", authMiddleware, issueCreditCard);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}/renovar:
 *   put:
 *     summary: Renueva Tarjeta de Credito (nueva fecha de vencimiento y cvv)
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Numero de Tarjeta de Credito
 *     responses:
 *       200:
 *         description: Tarjeta de Credito Renovada
 *       404:
 *         description: No Encontrado
 */
router.put("/:card_number/renovar", authMiddleware, renewCreditCard);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}/pagar:
 *   post:
 *     summary: Pagar Tarjeta Credito
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Numero Tarjeta de Credito
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
 *         description: Pago Exitoso
 *       400:
 *         description: Error
 */
router.post("/:card_number/pagar", authMiddleware, payCreditCard);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}:
 *   patch:
 *     summary: Actualizar Datos Tarjeta Credito (exp date, limite, etc)
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Numero Tarjeta de Credito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiration_date:
 *                 type: string
 *               credit_limit:
 *                 type: number
 *               available_credit:
 *                 type: number
 *               cut_date:
 *                 type: string
 *               due_date:
 *                 type: string
 *               interest:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tarjeta actualizada
 *       404:
 *         description: No Encontrada
 */
router.patch("/:card_number", authMiddleware, updateCreditCard);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}/status:
 *   patch:
 *     summary: Modificar Estado Tarjeta Credito (active, blocked, lost, etc)
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Numero Tarjeta de Credito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status Modificado
 *       404:
 *         description: No Encontrada
 */
router.patch("/:card_number/status", authMiddleware, updateCreditCardStatus);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}:
 *   delete:
 *     summary: Eliminar Tarjeta de Crédito (soft delete)
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de tarjeta de crédito (16 dígitos)
 *     responses:
 *       200:
 *         description: Tarjeta marcada como eliminada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditCard'
 *       404:
 *         description: Tarjeta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:card_number", authMiddleware, softDeleteCreditCard);

/**
 * @swagger
 * /api/tarjeta-credito:
 *   get:
 *     summary: Listar tarjetas de credito del usuario autenticado
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarjetas de credito activas (no eliminadas) del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreditCard'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authMiddleware, listUserCreditCards);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}/transacciones:
 *   get:
 *     summary: Obtener historial de transacciones de una tarjeta
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de tarjeta de crédito
 *     responses:
 *       200:
 *         description: Lista de transacciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   transaction_id:
 *                     type: integer
 *                   card_number:
 *                     type: string
 *                   type:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                   timestamp:
 *                     type: string
 */
router.get("/:card_number/transacciones", authMiddleware, getCardTransactions);

/**
 * @swagger
 * /api/tarjeta-credito/{card_number}/estado-cuenta:
 *   get:
 *     summary: Obtener estado de cuenta de una tarjeta
 *     tags: [TarjetaCredito]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de tarjeta de crédito
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Periodo en formato yyyymm (opcional)
 *     responses:
 *       200:
 *         description: Estado de cuenta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 card_number:
 *                   type: string
 *                 period:
 *                   type: string
 *                 start_date:
 *                   type: string
 *                 end_date:
 *                   type: string
 *                 previous_balance:
 *                   type: number
 *                 purchases:
 *                   type: number
 *                 payments:
 *                   type: number
 *                 current_balance:
 *                   type: number
 *                 due_date:
 *                   type: string
 *                 minimum_payment:
 *                   type: number
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/:card_number/estado-cuenta", authMiddleware, getCardStatement);

export default router;