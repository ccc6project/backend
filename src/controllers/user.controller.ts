import { Request, Response } from "express";
import { pool } from "../../db/connection.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { chooseFormat, sendFormatted } from "../utils/ResponseFormat.ts";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// REGISTER
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, document_type, document_number } = req.body;
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password, document_type, document_number) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, hashedPassword, document_type, document_number]
    );
    const user = result.rows[0];
    // Remove password from output
    delete user.password;
    const format = chooseFormat(req);
    sendFormatted(res, user, format, "user");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Remove password from output
    delete user.password;
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// LOGOUT (for JWT, it's stateless, just delete token on frontend)
// If you want to "logout", you can implement token blacklist, or just respond ok
export const logoutUser = (req: Request, res: Response) => {
  // On frontend, just delete/remove the JWT token from storage/cookies
  res.status(200).json({ message: "Logged out" });
};

// GET /api/users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    const format = chooseFormat(req);
    if (format === "xml") {
      sendFormatted(res, { item: result.rows }, format, "users");
    } else {
      sendFormatted(res, result.rows, format, "users");
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
