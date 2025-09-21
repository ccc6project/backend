import { Router } from "express";
import {
  getUserBankAccounts,
  addBankAccount,
  editBankAccount,
  depositToBankAccount,
  deleteBankAccount,
} from "../controllers/bankAccount.controller.ts";
import { authMiddleware } from "../middlewares/auth.ts";

/**
 * @swagger
 * tags:
 *   name: CuentasBanco
 *   description: Manejo cuentas de banco por usuario
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CuentaBanco:
 *       type: object
 *       properties:
 *         account_id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         bank_id:
 *           type: integer
 *         account_number:
 *           type: string
 *         account_type:
 *           type: string
 *         balance:
 *           type: number
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/cuentas-banco:
 *   get:
 *     summary: Listar cuentas de banco del usuario
 *     tags: [CuentasBanco]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de cuentas del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CuentaBanco'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", getUserBankAccounts);

/**
 * @swagger
 * /api/cuentas-banco:
 *   post:
 *     summary: Añadir cuenta de banco al usuario
 *     tags: [CuentasBanco]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bank_id, account_number, account_type]
 *             properties:
 *               bank_id:
 *                 type: integer
 *               account_number:
 *                 type: string
 *               account_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuentaBanco'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error en el servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", addBankAccount);

/**
 * @swagger
 * /api/cuentas-banco/{id}:
 *   put:
 *     summary: Editar cuenta de banco
 *     tags: [CuentasBanco]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_number:
 *                 type: string
 *               account_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cuenta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuentaBanco'
 *       404:
 *         description: Cuenta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", editBankAccount);

/**
 * @swagger
 * /api/cuentas-banco/{id}/deposito:
 *   post:
 *     summary: Hacer depósito a la cuenta de banco
 *     tags: [CuentasBanco]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Depósito exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 account:
 *                   $ref: '#/components/schemas/CuentaBanco'
 *       400:
 *         description: Monto inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cuenta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:id/deposito", depositToBankAccount);

/**
 * @swagger
 * /api/cuentas-banco/{id}:
 *   delete:
 *     summary: Eliminar cuenta de banco
 *     tags: [CuentasBanco]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la cuenta
 *     responses:
 *       200:
 *         description: Cuenta eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 account:
 *                   $ref: '#/components/schemas/CuentaBanco'
 *       404:
 *         description: Cuenta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", deleteBankAccount);

export default router;
