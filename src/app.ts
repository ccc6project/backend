import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes.ts";
import morgan from "morgan";
import { specs, swaggerUi } from "./config/swagger.ts";
import bankRoutes from "./routes/bank.routes.ts";
import bankAccountRoutes from "./routes/bankAccount.routes.ts";
import creditCardRoutes from "./routes/creditCard.routes.ts";
import authorizationRoutes from "./routes/authorization.routes.ts";

dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use("/api/usuarios", userRoutes);
app.use("/api/bancos", bankRoutes);
app.use("/api/cuentas-banco", bankAccountRoutes);
app.use("/api/tarjeta-credito", creditCardRoutes);
app.use("/authorization", authorizationRoutes);

export default app;
