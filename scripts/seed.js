const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load .env.local manually to prevent external dotenv dependencies
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found. Please ensure it is set up.");
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

const MOCK_ITEMS = [
  {
    name: "Truffle Ribeye Steak",
    price: 48.00,
    photo_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Pan-Seared Atlantic Salmon",
    price: 36.00,
    photo_url: "https://images.unsplash.com/photo-1485921325814-a50438496667?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Burrata & Heirloom Salad",
    price: 18.00,
    photo_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Truffle Garlic Parmesan Fries",
    price: 14.00,
    photo_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Molten Lava Chocolate Cake",
    price: 16.00,
    photo_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Signature Smoked Old Fashioned",
    price: 20.00,
    photo_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80"
  }
];

const ADMIN_ACCOUNTS = [
  {
    username: "admin",
    password: "admin123"
  }
];

async function seed() {
  console.log("Seeding PostgreSQL database...");
  
  try {
    console.log("Creating tables if they don't exist...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Tables created successfully.");

    // 1. Seed admin accounts
    console.log("Seeding admin_users table...");
    for (const admin of ADMIN_ACCOUNTS) {
      await pool.query(
        `INSERT INTO admin_users (username, password) 
         VALUES ($1, $2) 
         ON CONFLICT (username) DO NOTHING`,
        [admin.username, admin.password]
      );
    }
    console.log("Successfully seeded admin accounts!");

    // 2. Seed food items
    console.log("Seeding food_items table...");
    // Check if food_items is empty
    const res = await pool.query("SELECT COUNT(*) FROM food_items");
    if (parseInt(res.rows[0].count) === 0) {
      for (const item of MOCK_ITEMS) {
        await pool.query(
          "INSERT INTO food_items (name, price, photo_url) VALUES ($1, $2, $3)",
          [item.name, item.price, item.photo_url]
        );
      }
      console.log(`Successfully seeded ${MOCK_ITEMS.length} food items!`);
    } else {
      console.log("food_items table already has data, skipping seed.");
    }
    
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
