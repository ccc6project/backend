// src/controllers/bank.controller.ts
import { Request, Response } from "express";
import { pool } from "../../db/connection.ts";

/**
 * Create a new bank
 */
export const createBank = async (req: Request, res: Response) => {
  const { name, bank_code, host } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bank (name, bank_code, host) VALUES ($1, $2, $3) RETURNING *",
      [name, bank_code, host]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all banks
 */
export const getBanks = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM bank");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a bank
 */
export const updateBank = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, bank_code, host } = req.body;
  try {
    const result = await pool.query(
      "UPDATE bank SET name = $1, bank_code = $2, host = $3 WHERE bank_id = $4 RETURNING *",
      [name, bank_code, host, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bank not found" });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a bank
 */
export const deleteBank = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM bank WHERE bank_id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bank not found" });
    }
    res.json({ message: "Bank deleted", bank: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
