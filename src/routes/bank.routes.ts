// src/routes/bank.routes.ts
import { Router } from "express";
import { createBank, getBanks, updateBank, deleteBank } from "../controllers/bank.controller.ts";

/**
 * @swagger
 * tags:
 *   name: Bancos
 *   description: Manejo de Bancos
 */

const router = Router();

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
 *         description: Bank created
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
 *         description: List of banks
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
 *         description: Bank updated
 *       404:
 *         description: Bank not found
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
 *         description: Bank deleted
 *       404:
 *         description: Bank not found
 */
router.delete("/:id", deleteBank);

export default router;
