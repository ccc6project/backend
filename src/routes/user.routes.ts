import { Router } from "express";
import { createUser, getAllUsers, loginUser, logoutUser } from "../controllers/user.controller.ts";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Manejo de usuarios y autenticacion
 */

/**
 * @swagger
 * /api/usuarios/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Usuarios]
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
 *         description: Usuario Registrado Exitosamente
 *       500:
 *         description: Server error
 */
router.post("/signup", createUser);   // POST /api/usuarios/register

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Login, JWT
 *     tags: [Usuarios]
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
 *         description: Login Exitoso
 *       401:
 *         description: Email or Contrasena invalida
 */
router.post("/login", loginUser);       // POST /api/usuarios/login

/**
 * @swagger
 * /api/usuarios/logout:
 *   post:
 *     summary: Logout, delete JWT
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", logoutUser);     // POST /api/usuarios/logout

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Mostrar todo los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get("/", getAllUsers);           // GET /api/usuarios

export default router;
