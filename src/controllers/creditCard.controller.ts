// src/controllers/creditCard.controller.ts
import { Request, Response } from "express";
import { pool } from "../../db/connection.ts";
import { generateCardNumber, generateCVV, generateExpiration } from "../utils/creditCardGenerator.ts";
import { chooseFormat, sendFormatted } from "../utils/ResponseFormat.ts";

// Helper: Check if user has bank account
async function getUserBankAccount(user_id: number, bank_account_id?: number) {
  if (bank_account_id) {
    const r = await pool.query(
      "SELECT * FROM bank_account WHERE account_id = $1 AND user_id = $2",
      [bank_account_id, user_id]
    );
    return r.rows[0];
  } else {
    const r = await pool.query(
      "SELECT * FROM bank_account WHERE user_id = $1 LIMIT 1",
      [user_id]
    );
    return r.rows[0];
  }
}

// 1. Give a credit card to the user
export const issueCreditCard = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  const {
    bank_account_id,
    amount_authorized,
    cut_date,
    due_date,
    interest,
    amex,
    expiration_date, // optional override
    cardholder_name, // optional override
    credit_limit, // optional override (for clarity)
  } = req.body;
  try {
    // 1. Ensure user has a bank account
    const account = await getUserBankAccount(user_id, bank_account_id);
    if (!account) return res.status(400).json({ error: "No valid bank account found for user." });

    // 2. Generate credit card data
    const isAmex = !!amex;
    const card_number = generateCardNumber(isAmex);
    const cvv = generateCVV(isAmex);
    const name = cardholder_name || req.user.name || "CARDHOLDER";
    const exp = expiration_date || generateExpiration();
    const limit = credit_limit || amount_authorized || 10000;

    // 3. Insert credit card
    const result = await pool.query(
      `INSERT INTO credit_card
        (user_id, bank_id, card_number, cardholder_name, expiration_date, security_code, credit_limit, available_credit, status, cut_date, due_date, interest, bank_account_id, is_amex)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $7, 'active', $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user_id,
        account.bank_id,
        card_number,
        name,
        exp,
        cvv,
        limit,
        cut_date || null,
        due_date || null,
        interest || 0.28,
        account.account_id,
        isAmex,
      ]
    );
    const card = result.rows[0];
    const format = chooseFormat(req);
    sendFormatted(res, card, format, "credit_card");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Renew a credit card (update exp date and cvv)
export const renewCreditCard = async (req: Request, res: Response) => {
  const { card_number } = req.params;
  try {
    const card = (await pool.query("SELECT * FROM credit_card WHERE card_number = $1", [card_number])).rows[0];
    if (!card) return res.status(404).json({ error: "Credit card not found" });
    const newExp = generateExpiration();
    const newCVV = generateCVV(card.is_amex);
    const result = await pool.query(
      "UPDATE credit_card SET expiration_date = $1, security_code = $2 WHERE card_number = $3 RETURNING *",
      [newExp, newCVV, card_number]
    );
    const format = chooseFormat(req);
    sendFormatted(res, result.rows[0], format, "credit_card");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Pay credit card
export const payCreditCard = async (req: Request, res: Response) => {
  const user_id = req.user.user_id;
  const { card_number } = req.params;
  const { amount, bank_account_id } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  try {
    // Get the card and ensure it belongs to user
    const card = (await pool.query("SELECT * FROM credit_card WHERE card_number = $1 AND user_id = $2", [card_number, user_id])).rows[0];
    if (!card) return res.status(404).json({ error: "Credit card not found" });

    // Pick selected or default bank account
    const account = await getUserBankAccount(user_id, bank_account_id || card.bank_account_id);
    if (!account) return res.status(400).json({ error: "No valid bank account found." });

    // Check sufficient funds
    if (account.balance < amount) return res.status(400).json({ error: "Not enough funds in account." });

    // Perform transaction as an atomic update (with SQL transaction for concurrency safety)
    await pool.query("BEGIN");
    await pool.query("UPDATE bank_account SET balance = balance - $1 WHERE account_id = $2", [amount, account.account_id]);
    await pool.query("UPDATE credit_card SET available_credit = available_credit + $1 WHERE card_number = $2", [amount, card_number]);
    // Add transaction log
    await pool.query(
      `INSERT INTO card_transaction (card_number, type, amount, status, source_account_id, description)
       VALUES ($1, 'PAYMENT', $2, 'APPROVED', $3, $4)`,
      [card_number, amount, account.account_id, "Payment to credit card"]
    );
    await pool.query("COMMIT");
    res.json({ message: "Payment successful" });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

// 4. Authorization endpoint (stateless, GET with params, returns JSON/XML)
export const authorizeTransaction = async (req: Request, res: Response) => {
  // Accept params via query string
  const {
    tarjeta, // card_number
    nombre, // cardholder_name
    fecha_venc, // expiration_date (yyyymm)
    num_seguridad, // security_code (cvv)
    monto, // amount
    tienda, // store
    formato, // 'JSON' or 'XML'
  } = req.query;

  // 1. Validate input
  if (!tarjeta || !nombre || !fecha_venc || !num_seguridad || !monto || !tienda)
    return res.status(400).json({ error: "Missing required params" });

  let transaction_status = "PENDING";
  let auth_status = "DENEGADO";
  let numero_autorizacion = "0";
  let transaction_id: number | null = null;
  let status = "INCOMPLETE";

  try {
    // Open SQL transaction for concurrency safety
    await pool.query("BEGIN");

    // 2. Find and lock credit card row
    const result = await pool.query(
      `SELECT * FROM credit_card WHERE card_number = $1 FOR UPDATE`,
      [tarjeta]
    );
    const card = result.rows[0];
    if (!card) status = "DENIED";
    else if (
      card.cardholder_name !== nombre ||
      card.expiration_date !== fecha_venc ||
      card.security_code !== num_seguridad ||
      card.status !== "active"
    ) {
      status = "DENIED";
    } else if (parseFloat(monto as string) > parseFloat(card.available_credit)) {
      status = "DENIED";
    } else if (card.expiration_date < getTodayYearMonth()) {
      status = "DENIED";
    } else {
      status = "APPROVED";
      auth_status = "APROBADO";
      // Autogenerate number (just a random 6 digits)
      numero_autorizacion = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 3. Create transaction record with appropriate status
    const trResult = await pool.query(
      `INSERT INTO card_transaction (card_number, type, amount, status, description, store, authorization_id)
       VALUES ($1, 'PURCHASE', $2, $3, $4, $5, NULL) RETURNING transaction_id`,
      [tarjeta, monto, status, tienda, tienda]
    );
    transaction_id = trResult.rows[0]?.transaction_id;

    // 4. If approved, update credit card balance
    if (status === "APPROVED") {
      await pool.query(
        "UPDATE credit_card SET available_credit = available_credit - $1 WHERE card_number = $2",
        [monto, tarjeta]
      );
    }

    await pool.query("COMMIT");

    // 5. Format response
    const response = {
      emisor: card?.is_amex ? "AMEX" : "VISA",
      tarjeta,
      status: auth_status,
      numero: numero_autorizacion,
    };
    // Use your formatting helper
    const format = (formato || chooseFormat(req) || "json").toLowerCase();
    sendFormatted(res, response, format, "autorizacion");
  } catch (err: any) {
    await pool.query("ROLLBACK");
    // Create a transaction log with status INCOMPLETE
    if (tarjeta) {
      await pool.query(
        `INSERT INTO card_transaction (card_number, type, amount, status, description, store)
         VALUES ($1, 'PURCHASE', $2, 'INCOMPLETE', $3, $4)`,
        [tarjeta, monto || 0, "INCOMPLETE TRANSACTION", tienda || "UNKNOWN"]
      );
    }
    res.status(500).json({ error: err.message });
  }
};

// Helper to get today in yyyymm format
function getTodayYearMonth() {
  const d = new Date();
  return d.getFullYear().toString() + (d.getMonth() + 1).toString().padStart(2, "0");
}
