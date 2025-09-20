import { Router } from "express";
import { createUser, getAllUsers, loginUser, logoutUser } from "../controllers/user.controller.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - document_type
 *               - document_number
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               document_type:
 *                 type: string
 *               document_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *       500:
 *         description: Server error
 */
router.post("/register", createUser);   // POST /api/users/register

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user and get JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", loginUser);       // POST /api/users/login

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout a user (client should delete JWT)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", logoutUser);     // POST /api/users/logout

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", getAllUsers);           // GET /api/users

export default router;
