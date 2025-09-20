import app from "./app.ts";
import * as dotenv from 'dotenv';
import db from "../db/connection.ts";
dotenv.config();


const PORT = process.env.PORT || 5300;
db()
    .then(() => {
    app.listen(PORT, () => console.log(`Server Open & Connected To Database 🤟 API on: ${PORT}`));
})
    .catch((err: any) => console.log(err));
