import { Router } from "express";
import { createBank, getBanks, updateBank, deleteBank } from "../controllers/bank.controller.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bancos
 *   description: Manejo de Bancos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Banco:
 *       type: object
 *       properties:
 *         bank_id:
 *           type: integer
 *         name:
 *           type: string
 *         bank_code:
 *           type: string
 *         host:
 *           type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/bancos:
 *   post:
 *     summary: Crear banco
 *     tags: [Bancos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, bank_code]
 *             properties:
 *               name:
 *                 type: string
 *               bank_code:
 *                 type: string
 *               host:
 *                 type: string
 *     responses:
 *       201:
 *         description: Banco creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banco'
 *       500:
 *         description: Error en el servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", createBank);

/**
 * @swagger
 * /api/bancos:
 *   get:
 *     summary: Todos los bancos
 *     tags: [Bancos]
 *     responses:
 *       200:
 *         description: Listado de bancos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Banco'
 *       500:
 *         description: Error en el servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", getBanks);

/**
 * @swagger
 * /api/bancos/{id}:
 *   put:
 *     summary: Modificar banco
 *     tags: [Bancos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bank ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bank_code:
 *                 type: string
 *               host:
 *                 type: string
 *     responses:
 *       200:
 *         description: Banco modificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Banco'
 *       404:
 *         description: Banco no encontrado
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
router.put("/:id", updateBank);

/**
 * @swagger
 * /api/bancos/{id}:
 *   delete:
 *     summary: Borrar banco
 *     tags: [Bancos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bank ID
 *     responses:
 *       200:
 *         description: Banco borrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bank:
 *                   $ref: '#/components/schemas/Banco'
 *       404:
 *         description: Banco no encontrado
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
router.delete("/:id", deleteBank);

export default router;
