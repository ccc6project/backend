import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.ts";
import morgan from "morgan";
import { specs, swaggerUi } from "./config/swagger.ts";
import bankRoutes from "./routes/bank.routes.ts";
import bankAccountRoutes from "./routes/bankAccount.routes.ts";
import creditCardRoutes from "./routes/creditCard.routes.ts";

dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/usuarios", userRoutes);
app.use("/api/bancos", bankRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api/credit-cards", creditCardRoutes);

export default app;
