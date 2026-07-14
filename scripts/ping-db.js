const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`^\\s*${key}\\s*=\\s*"?([^"]*)"?`, "m"));
  return match ? match[1].trim() : null;
};

const databaseUrl = getEnvVal("DATABASE_URL");

if (!databaseUrl) {
  console.error("Error: Missing DATABASE_URL environment variable in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function ping() {
  console.log(`[${new Date().toISOString()}] Pinging PostgreSQL database...`);
  
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connection successful!");
    console.log("Database time:", res.rows[0].now);
  } catch (err) {
    console.error("Ping failed:", err.message);
  } finally {
    await pool.end();
  }
}

ping();
