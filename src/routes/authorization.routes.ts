// backend/src/routes/authorization.routes.ts
import { Router } from "express";
import { authorizeTransaction } from "../controllers/creditCard.controller.ts";

/**
 * @swagger
 * components:
 *   schemas:
 *     AutorizacionRespuesta:
 *       type: object
 *       properties:
 *         emisor:
 *           type: string
 *           example: "CREDITSYSTEM001"
 *         tarjeta:
 *           type: string
 *           example: "1234567890123456"
 *         status:
 *           type: string
 *           enum: [APROBADO, DENEGADO]
 *         numero:
 *           type: string
 *           example: "654321"
 *     CreditCard:
 *       type: object
 *       properties:
 *         card_number:
 *           type: string
 *           example: "1234567890123456"
 *         cardholder_name:
 *           type: string
 *         expiration_date:
 *           type: string
 *           example: "202912"
 *         security_code:
 *           type: string
 *           example: "123"
 *         credit_limit:
 *           type: number
 *         available_credit:
 *           type: number
 *         cut_date:
 *           type: string
 *           example: "20241014"
 *         due_date:
 *           type: string
 *           example: "20241028"
 *         status:
 *           type: string
 *           enum: [active, blocked, lost, deleted]
 *         emisor_id:
 *           type: string
 *           example: "CREDITSYSTEM001"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /autorizacion:
 *   get:
 *     summary: Autorizar transacción de tarjeta de crédito
 *     tags: [TarjetaCredito]
 *     parameters:
 *       - in: query
 *         name: tarjeta
 *         required: true
 *         schema: { type: string, pattern: "^[0-9]{16}$" }
 *         description: Número de tarjeta de crédito (16 dígitos, sin guiones)
 *       - in: query
 *         name: nombre
 *         required: true
 *         schema: { type: string }
 *         description: Nombre del titular
 *       - in: query
 *         name: fecha_venc
 *         required: true
 *         schema: { type: string, pattern: "^[0-9]{6}$" }
 *         description: Fecha de vencimiento (yyyymm)
 *       - in: query
 *         name: num_seguridad
 *         required: true
 *         schema: { type: string, pattern: "^[0-9]{3}$" }
 *         description: CVV (3 dígitos)
 *       - in: query
 *         name: monto
 *         required: true
 *         schema: { type: number }
 *         description: Monto de la transacción
 *       - in: query
 *         name: tienda
 *         required: true
 *         schema: { type: string }
 *         description: Nombre de la tienda
 *       - in: query
 *         name: formato
 *         schema: { type: string, enum: [JSON, XML] }
 *         description: Formato de respuesta (JSON o XML)
 *     responses:
 *       200:
 *         description: Respuesta de autorización
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutorizacionRespuesta'
 *             example:
 *               emisor: "CREDITSYSTEM001"
 *               tarjeta: "1234567890123456"
 *               status: "APROBADO"
 *               numero: "654321"
 *           application/xml:
 *             example: |
 *               <autorizacion>
 *                 <emisor>CREDITSYSTEM001</emisor>
 *                 <tarjeta>1234567890123456</tarjeta>
 *                 <status>APROBADO</status>
 *                 <numero>654321</numero>
 *               </autorizacion>
 *       400:
 *         description: Parámetros incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const router = Router();
router.get("/", authorizeTransaction);

export default router;
