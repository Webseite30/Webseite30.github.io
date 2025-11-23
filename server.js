import express from "express";
import pkg from "pg";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const app = express();
app.use(express.json());

// ===== statische Dateien ausliefern =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// ===== Datenbank-Connection =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ===== Tabellen automatisch anlegen =====
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      hash TEXT NOT NULL,
      reg_time_ms INT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS logins (
      id SERIAL PRIMARY KEY,
      username TEXT,
      login_time_ms INT,
      success BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("Datenbank-Tabellen geprüft / erstellt.");
}

// ===== Registrierung =====
app.post("/register", async (req, res) => {
  const { username, password, duration_ms } = req.body;

  if (!username || !password) return res.status(400).send("Missing username or password");

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  try {
    await pool.query(
      `INSERT INTO users (username, hash, reg_time_ms)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [username, hash, duration_ms]
    );
    res.send("registered");
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ===== Login =====
app.post("/login", async (req, res) => {
  const { username, password, duration_ms } = req.body;

  if (!username || !password) return res.status(400).send("Missing username or password");

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  try {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE username=$1 AND hash=$2`,
      [username, hash]
    );

    const success = result.rowCount > 0;

    await pool.query(
      `INSERT INTO logins (username, login_time_ms, success)
       VALUES ($1, $2, $3)`,
      [username, duration_ms, success]
    );

    res.send(success ? "login ok" : "login failed");
  } catch (e) {
    console.error(e);
    res.status(500).send("DB error");
  }
});

// ===== Server starten =====
app.listen(3000, async () => {
  console.log("Server läuft auf Port 3000");
  await initDb();
});
