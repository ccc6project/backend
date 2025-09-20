// src/controllers/bankAccount.controller.ts
import { Request, Response } from "express";
import { pool } from "../../db/connection.ts";

// Get all bank accounts of the user
export const getUserBankAccounts = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  try {
    const result = await pool.query(
      "SELECT * FROM bank_account WHERE user_id = $1",
      [user_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Add bank account for the user
export const addBankAccount = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  const { bank_id, account_number, account_type, balance } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bank_account (user_id, bank_id, account_number, account_type, balance) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [user_id, bank_id, account_number, account_type, balance || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Edit bank account (type/number only, not balance)
export const editBankAccount = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  const { id } = req.params;
  const { account_number, account_type } = req.body;
  try {
    const result = await pool.query(
      "UPDATE bank_account SET account_number = $1, account_type = $2 WHERE account_id = $3 AND user_id = $4 RETURNING *",
      [account_number, account_type, id, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Make deposit to account
export const depositToBankAccount = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  const { id } = req.params;
  const { amount } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid deposit amount" });
  }
  try {
    const result = await pool.query(
      "UPDATE bank_account SET balance = balance + $1 WHERE account_id = $2 AND user_id = $3 RETURNING *",
      [amount, id, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json({ message: "Deposit successful", account: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Delete bank account
export const deleteBankAccount = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM bank_account WHERE account_id = $1 AND user_id = $2 RETURNING *",
      [id, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json({ message: "Bank account deleted", account: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
