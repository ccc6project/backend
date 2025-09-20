// src/routes/bankAccount.routes.ts
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
 *   name: BankAccounts
 *   description: Bank account management for users
 */

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/bank-accounts:
 *   get:
 *     summary: Get bank accounts of current user
 *     tags: [BankAccounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bank accounts
 */
router.get("/", getUserBankAccounts);

/**
 * @swagger
 * /api/bank-accounts:
 *   post:
 *     summary: Add a bank account to the user
 *     tags: [BankAccounts]
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
 *         description: Bank account created
 */
router.post("/", addBankAccount);

/**
 * @swagger
 * /api/bank-accounts/{id}:
 *   put:
 *     summary: Edit bank account of the user
 *     tags: [BankAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Account ID
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
 *         description: Bank account updated
 *       404:
 *         description: Not found
 */
router.put("/:id", editBankAccount);

/**
 * @swagger
 * /api/bank-accounts/{id}/deposit:
 *   post:
 *     summary: Make deposit to bank account
 *     tags: [BankAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Account ID
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
 *         description: Deposit successful
 *       400:
 *         description: Invalid amount
 *       404:
 *         description: Not found
 */
router.post("/:id/deposit", depositToBankAccount);

/**
 * @swagger
 * /api/bank-accounts/{id}:
 *   delete:
 *     summary: Delete a bank account
 *     tags: [BankAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: Not found
 */
router.delete("/:id", deleteBankAccount);

export default router;
