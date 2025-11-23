import express from "express";
import pkg from "pg";
import crypto from "crypto";

const { Pool } = pkg;
const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.post("/register", async (req, res) => {
  const { username, password, duration_ms } = req.body;
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  await pool.query(
    "INSERT INTO users (username, hash, reg_time_ms) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
    [username, hash, duration_ms]
  );

  res.send("registered");
});

app.post("/login", async (req, res) => {
  const { username, password, duration_ms } = req.body;
  const hash = crypto.createHash("sha256").update(password).digest("hex");

  const result = await pool.query(
    "SELECT 1 FROM users WHERE username=$1 AND hash=$2",
    [username, hash]
  );

  await pool.query(
    "INSERT INTO logins (username, login_time_ms, success) VALUES ($1, $2, $3)",
    [username, duration_ms, result.rowCount > 0]
  );

  res.send(result.rowCount > 0 ? "login ok" : "login failed");
});

app.listen(3000, () => console.log("Server läuft auf Port 3000"));
