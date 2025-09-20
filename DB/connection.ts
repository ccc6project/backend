import { Pool, QueryArrayConfig } from "pg";

const POSTGRES_HOST = process.env.POSTGRES_HOST || "localhost";
const POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
const POSTGRES_DB = process.env.POSTGRES_DB || "postgres";
const POSTGRES_PASS = process.env.POSTGRES_PASS || "o1234";
const POSTGRES_PORT = Number(process.env.POSTGRES_PORT) || 4321;

const pool = new Pool({
    user: POSTGRES_USER,
    password: POSTGRES_PASS,
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB
});

// Function to connect (for "await db()")
const db = async () => {
    try {
        await pool.connect();
        console.log("✅ Connected to Postgres!");
    } catch (err) {
        console.error("❌ Database connection failed:", err);
        throw err;
    }
};

export default db;
export { pool };
