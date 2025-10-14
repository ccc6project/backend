// src/controllers/creditCard.controller.ts
import { Request, Response } from "express";
import { pool } from "../../db/connection.ts";
import { generateCardNumber, generateCVV, generateExpiration, validateDateYMD, validateExpDate } from "../utils/creditCardGenerator.ts";
import { chooseFormat, sendFormatted } from "../utils/ResponseFormat.ts";

// Motivos estandarizados (mantener en inglés para datos, pero describe en español al usuario si quieres)
type DeniedReason =
  | "CARD_NOT_FOUND"
  | "CARD_INACTIVE"
  | "EXPIRED_CARD"
  | "INVALID_EXPIRY_FORMAT"
  | "INVALID_CVV"
  | "NAME_MISMATCH"
  | "OVER_LIMIT"
  | "INSUFFICIENT_FUNDS"
  | "DUPLICATE"
  | "VELOCITY_LIMIT"
  | "MERCHANT_BLOCKED"
  | "CURRENCY_BLOCKED"
  | "SYSTEM_ERROR";

// Normaliza nombre para comparación suave
function normalizeName(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// Anti-duplicados: misma tarjeta+monto+tienda en los últimos N segundos
async function isDuplicateTxn(card_number: string, amount: number, store: string, seconds = 60) {
  const r = await pool.query(
    `SELECT 1
       FROM card_transaction
      WHERE card_number = $1
        AND type = 'PURCHASE'
        AND status = 'APPROVED'
        AND amount = $2
        AND store = $3
        AND "timestamp" >= NOW() - INTERVAL '${seconds} seconds'
      LIMIT 1`,
    [card_number, amount, store]
  );
  return r.rowCount! > 0;
}

// Velocity: más de K compras aprobadas en los últimos M minutos
async function exceedsVelocity(card_number: string, k = 5, minutes = 1) {
  const r = await pool.query(
    `SELECT count(*)::int AS n
       FROM card_transaction
      WHERE card_number = $1
        AND type = 'PURCHASE'
        AND status = 'APPROVED'
        AND "timestamp" >= NOW() - INTERVAL '${minutes} minutes'`,
    [card_number]
  );
  return (r.rows[0]?.n ?? 0) >= k;
}


// ✅ Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        name?: string;
        email?: string;
        // Agrega otros campos que necesites
      };
    }
  }
}

// Helper to get today in yyyymm format
function getTodayYearMonth() {
  const d = new Date();
  return d.getFullYear().toString() + (d.getMonth() + 1).toString().padStart(2, "0");
}

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

export const issueCreditCard = async (req: Request, res: Response) => {
  // ✅ Validar que user existe
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user_id = req.user.user_id;
  const {
    bank_account_id,
    amount_authorized,
    cut_date,
    due_date,
    interest,
    expiration_date,
    cardholder_name,
    credit_limit,
    emisor_id
  } = req.body;

  try {
    if (expiration_date && !validateExpDate(expiration_date))
      return res.status(400).json({ error: "Formato de fecha de vencimiento incorrecto (yyyymm)" });
    if (emisor_id && emisor_id.length !== 15)
      return res.status(400).json({ error: "El emisor debe tener 15 caracteres" });

    const account = await getUserBankAccount(user_id, bank_account_id);
    if (!account) return res.status(400).json({ error: "No valid bank account found for user." });

    const card_number = generateCardNumber();
    const cvv = generateCVV();
    const name = cardholder_name || req.user.name || "CARDHOLDER";
    const exp = expiration_date || generateExpiration();
    const limit = credit_limit || amount_authorized || 10000;

    const result = await pool.query(
      `INSERT INTO credit_card
        (user_id, bank_id, card_number, cardholder_name, expiration_date, security_code, credit_limit, available_credit, status, cut_date, due_date, interest, bank_account_id, emisor_id)
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
        emisor_id || 'CREDITSYSTEM001'
      ]
    );
    const card = result.rows[0];
    const format = chooseFormat(req);
    sendFormatted(res, card, format, "credit_card");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCardTransactions = async (req: Request, res: Response) => {
  // ✅ Validar que user existe
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user_id = req.user.user_id;
  const { card_number } = req.params;

  try {
    const cardResult = await pool.query(
      "SELECT * FROM credit_card WHERE card_number = $1 AND user_id = $2",
      [card_number, user_id]
    );

    if (cardResult.rowCount === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    const transactions = await pool.query(
      `SELECT * FROM card_transaction
       WHERE card_number = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [card_number]
    );

    const format = chooseFormat(req);
    sendFormatted(res, transactions.rows, format, "transactions");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCardStatement = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user_id = req.user.user_id;
  const { card_number } = req.params;
  const { period } = req.query;

  console.log('🔍 DEBUG STATEMENT - Iniciando');
  console.log('Card:', card_number);
  console.log('User:', user_id);

  try {
    const cardResult = await pool.query(
      "SELECT * FROM credit_card WHERE card_number = $1 AND user_id = $2",
      [card_number, user_id]
    );

    console.log('📋 Card query result:', cardResult.rows[0]);

    if (cardResult.rowCount === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    const card = cardResult.rows[0];

    // ✅ FORMA MEJORADA: Manejo robusto de fechas
    const now = new Date();
    let usePeriod: string;
    let startDate: string;
    let endDate: string;

    if (period && typeof period === 'string' && period.length === 6) {
      // Usar el periodo proporcionado
      usePeriod = period;
      const year = parseInt(period.slice(0, 4));
      const month = parseInt(period.slice(4, 6));

      startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    } else {
      // Usar el mes actual
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      usePeriod = `${year}${month.toString().padStart(2, '0')}`;

      startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    }

    console.log('📅 Period dates:', { usePeriod, startDate, endDate });

    // ✅ TEMPORAL: Para testing, quitar filtro de fechas
    const transactions = await pool.query(
      `SELECT * FROM card_transaction
       WHERE card_number = $1
       ORDER BY timestamp DESC`,
      [card_number]
    );

    console.log('💳 Transactions found:', transactions.rows.length);

    // Mostrar las fechas de las transacciones para debug
    transactions.rows.forEach((t: any, index: number) => {
      console.log(`Transacción ${index + 1}:`, {
        date: t.timestamp,
        type: t.type,
        amount: t.amount,
        store: t.store
      });
    });

    const purchases = transactions.rows
      .filter((t: any) => t.type === 'PURCHASE' && t.status === 'APPROVED')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const payments = transactions.rows
      .filter((t: any) => t.type === 'PAYMENT' && t.status === 'APPROVED')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const currentBalance = card.credit_limit - card.available_credit;

    const statement = {
      card_number: card.card_number,
      cardholder_name: card.cardholder_name,
      period: usePeriod,
      start_date: startDate,
      end_date: endDate,
      credit_limit: card.credit_limit,
      available_credit: card.available_credit,
      previous_balance: 0,
      purchases: purchases,
      payments: payments,
      current_balance: currentBalance,
      due_date: card.due_date,
      minimum_payment: Math.max(currentBalance * 0.05, 50),
      transactions: transactions.rows
    };

    console.log('🎯 FINAL STATEMENT:');
    console.log('Transactions in statement:', statement.transactions.length);
    console.log('Purchases total:', purchases);
    console.log('Payments total:', payments);

    const format = chooseFormat(req);
    sendFormatted(res, statement, format, "statement");

  } catch (err: any) {
    console.error('💥 ERROR in getCardStatement:', err);
    res.status(500).json({ error: err.message });
  }
};

export const renewCreditCard = async (req: Request, res: Response) => {
  const { card_number } = req.params;
  try {
    const card = (await pool.query("SELECT * FROM credit_card WHERE card_number = $1", [card_number])).rows[0];
    if (!card) return res.status(404).json({ error: "Credit card not found" });

    const newExp = generateExpiration();
    const newCVV = generateCVV();
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

export const payCreditCard = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user_id = req.user.user_id;
  const { card_number } = req.params;
  const { amount, bank_account_id } = req.body;

  console.log('🔍 DEBUG PAYMENT - Iniciando');
  console.log('Card number:', card_number);
  console.log('User ID:', user_id);
  console.log('Amount:', amount);
  console.log('Bank Account ID:', bank_account_id);

  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  try {
    const cardResult = await pool.query(
      "SELECT * FROM credit_card WHERE card_number = $1 AND user_id = $2",
      [card_number, user_id]
    );

    console.log('📋 Card query result:', cardResult.rows[0]);
    console.log('📊 Cards found:', cardResult.rowCount);

    if (cardResult.rowCount === 0) {
      console.log('❌ Credit card not found for user');
      return res.status(404).json({ error: "Credit card not found" });
    }

    const card = cardResult.rows[0];
    console.log('✅ Card found:', card.card_number, card.cardholder_name);

    const account = await getUserBankAccount(user_id, bank_account_id || card.bank_account_id);
    console.log('🏦 Bank account found:', account);

    if (!account) return res.status(400).json({ error: "No valid bank account found." });

    if (account.balance < amount) return res.status(400).json({ error: "Not enough funds in account." });

    await pool.query("BEGIN");
    await pool.query("UPDATE bank_account SET balance = balance - $1 WHERE account_id = $2", [amount, account.account_id]);
    await pool.query("UPDATE credit_card SET available_credit = available_credit + $1 WHERE card_number = $2", [amount, card_number]);

    // ✅ CORREGIDO: Para PAGOS, no incluir store o usar un valor por defecto
    await pool.query(
      `INSERT INTO card_transaction (card_number, type, amount, status, source_account_id, description, store)
       VALUES ($1, 'PAYMENT', $2, 'APPROVED', $3, $4, $5)`,
      [card_number, amount, account.account_id, "Payment to credit card", "Pago de tarjeta"] // ← Agregar store con valor por defecto
    );

    await pool.query("COMMIT");

    console.log('✅ Payment successful');
    res.json({ message: "Payment successful" });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error('💥 ERROR in payCreditCard:', err);
    res.status(500).json({ error: err.message });
  }
};

// Helpers bien simples
function genAuthNumber(): string {
  // 6 dígitos, o cambia a lo que uses (p.e. secuencia DB)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authorizeTransaction = async (req: Request, res: Response) => {
  const {
    tarjeta,
    nombre,
    fecha_venc,
    num_seguridad,
    monto,
    tienda,
    formato,
  } = req.query;

  console.log('🔍 DEBUG AUTHORIZATION - Iniciando');
  console.log('Store value:', tienda); // ← Verificar que viene el store

  if (!tarjeta || !nombre || !fecha_venc || !num_seguridad || !monto || !tienda)
    return res.status(400).json({ error: "Missing required params" });

  // let auth_status = "DENEGADO";
  // let numero_autorizacion = "0";
  // let status = "INCOMPLETE";

  try {
    await pool.query("BEGIN");

    const result = await pool.query(
      `SELECT * FROM credit_card WHERE card_number = $1 FOR UPDATE`,
      [tarjeta]
    );
    const card = result.rows[0];

    let auth_status = "DENEGADO";
    let numero_autorizacion = "0";
    let status: "APPROVED" | "DENIED" | "INCOMPLETE" = "INCOMPLETE";
    let denied_reason: string | null = null;

    // Reglas de decisión (solo marcan status + denied_reason)
    // NOTA: no hacemos INSERT aquí; el INSERT es único y está más abajo.
    if (!card) {
      status = "DENIED";
      denied_reason = "CARD_NOT_FOUND";
    } else if (card.status !== "active") {
      status = "DENIED";
      denied_reason = "CARD_INACTIVE";
    } else if (String(card.cardholder_name).trim().toLowerCase() !== String(nombre).trim().toLowerCase()) {
      status = "DENIED";
      denied_reason = "NAME_MISMATCH";
    } else if (String(card.expiration_date) !== String(fecha_venc)) {
      status = "DENIED";
      denied_reason = "INVALID_EXPIRY_FORMAT"; // o "EXPIRED_CARD" si quieres validar formato vs. vigencia
    } else if (String(card.security_code) !== String(num_seguridad)) {
      status = "DENIED";
      denied_reason = "INVALID_CVV";
    } else if (parseInt(card.expiration_date as string, 10) < parseInt(getTodayYearMonth(), 10)) {
      status = "DENIED";
      denied_reason = "EXPIRED_CARD";
    } else if (parseFloat(monto as string) > parseFloat(card.available_credit as any)) {
      status = "DENIED";
      denied_reason = "INSUFFICIENT_FUNDS";
    } else {
      status = "APPROVED";
      auth_status = "APROBADO";
      numero_autorizacion = genAuthNumber();
    }

    // ✅ CORREGIDO: Asegurar que store tenga un valor
    // const storeValue = tienda || "Tienda Online"; // ← Valor por defecto

    const storeValue = (tienda as string) || "Tienda Online";

    // INSERT ÚNICO
    const trResult = await pool.query(
      `INSERT INTO card_transaction
        (card_number, type, amount, status, denied_reason, description, store, authorization_id)
      VALUES
        ($1, 'PURCHASE', $2, $3, $4, $5, $6, NULL)
      RETURNING transaction_id`,
      [
        tarjeta,
        monto,
        status,
        status === "DENIED" ? denied_reason : null, // ← guardamos SOLO el código
        `Compra en ${storeValue}`,
        storeValue,
      ]
);


    console.log('✅ Transaction inserted with store:', storeValue);

    // Si fue aprobada, debitamos
    if (status === "APPROVED") {
      await pool.query(
        "UPDATE credit_card SET available_credit = available_credit - $1 WHERE card_number = $2",
        [monto, tarjeta]
      );
    }

    await pool.query("COMMIT");

    const response = {
      emisor: "AMEX",
      tarjeta,
      status: auth_status,
      numero: numero_autorizacion,
    };

    const formatValue = formato
      ? (String(formato).toLowerCase() as 'json' | 'xml')
      : chooseFormat(req);
    sendFormatted(res, response, formatValue, "autorizacion");
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error('💥 ERROR in authorizeTransaction:', err);
    if (tarjeta) {
      const storeValue = tienda || "Tienda Desconocida"; // ← Valor por defecto también en el error
      await pool.query(
        `INSERT INTO card_transaction (card_number, type, amount, status, description, store)
         VALUES ($1, 'PURCHASE', $2, 'INCOMPLETE', $3, $4)`,
        [tarjeta, monto || 0, "INCOMPLETE TRANSACTION", storeValue]
      );
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateCreditCard = async (req: Request, res: Response) => {
  const { card_number } = req.params;
  const { expiration_date, credit_limit, available_credit, cut_date, due_date, interest } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (expiration_date) { fields.push(`expiration_date = $${idx++}`); values.push(expiration_date); }
    if (credit_limit)     { fields.push(`credit_limit = $${idx++}`); values.push(credit_limit); }
    if (available_credit) { fields.push(`available_credit = $${idx++}`); values.push(available_credit); }
    if (cut_date)         { fields.push(`cut_date = $${idx++}`); values.push(cut_date); }
    if (due_date)         { fields.push(`due_date = $${idx++}`); values.push(due_date); }
    if (interest)         { fields.push(`interest = $${idx++}`); values.push(interest); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields provided to update" });

    values.push(card_number);

    const result = await pool.query(
      `UPDATE credit_card SET ${fields.join(', ')} WHERE card_number = $${idx} RETURNING *`,
      values
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Card not found" });

    const format = chooseFormat(req);
    sendFormatted(res, result.rows[0], format, "credit_card");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCreditCardStatus = async (req: Request, res: Response) => {
  const { card_number } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "No status provided" });

  try {
    const result = await pool.query(
      `UPDATE credit_card SET status = $1 WHERE card_number = $2 RETURNING *`,
      [status, card_number]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: "Card not found" });

    const format = chooseFormat(req);
    sendFormatted(res, result.rows[0], format, "credit_card");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listUserCreditCards = async (req: Request, res: Response) => {
  // ✅ Validar que user existe
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const user_id = req.user.user_id;
  try {
    const result = await pool.query(
      "SELECT * FROM credit_card WHERE user_id = $1 AND status != 'deleted' ORDER BY expiration_date DESC",
      [user_id]
    );
    const format = chooseFormat(req);
    sendFormatted(res, result.rows, format, "credit_cards");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const softDeleteCreditCard = async (req: Request, res: Response) => {
  const { card_number } = req.params;
  try {
    const result = await pool.query(
      "UPDATE credit_card SET status = 'deleted' WHERE card_number = $1 RETURNING *",
      [card_number]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Credit card not found" });

    sendFormatted(res, result.rows[0], chooseFormat(req), "credit_card");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};