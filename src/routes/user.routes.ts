import { Router } from "express";
import { getAllUsers } from "../controllers/user.controller.ts";

const router = Router();

router.get("/", getAllUsers);

export default router;
