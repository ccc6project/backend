import app from "./app.ts";
import * as dotenv from 'dotenv';
import db from "../db/connection.ts";
dotenv.config();


const PORT = process.env.PORT || 5000;
db()
    .then(() => {
    app.listen(PORT, () => console.log("Server Open & Connected To Database  🤟"));
})
    .catch((err: any) => console.log(err));
