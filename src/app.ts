import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.ts";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Import routers here
app.use("/api/users", userRoutes);

export default app;
