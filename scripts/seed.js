const { createClient } = require("@supabase/supabase-js");
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
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVal("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = getEnvVal("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  console.log("Seeding Supabase database...");
  
  // 1. Seed admin accounts
  try {
    console.log("Seeding admin_users table...");
    const { data: existingAdmin, error: checkAdminError } = await supabase
      .from("admin_users")
      .select("id")
      .limit(1);

    if (checkAdminError) {
      console.warn("Notice: admin_users table verify failed. Ensure table is created in Supabase SQL editor.");
      throw checkAdminError;
    }

    const { data: insertedAdmin, error: insertAdminError } = await supabase
      .from("admin_users")
      .upsert(ADMIN_ACCOUNTS, { onConflict: "username" })
      .select();

    if (insertAdminError) throw insertAdminError;
    console.log(`Successfully seeded ${insertedAdmin.length} admin accounts!`);
  } catch (err) {
    console.error("Admin seeding failed:", err.message);
  }

  // 2. Seed food items
  try {
    console.log("Seeding food_items table...");
    const { data: existingItems, error: checkError } = await supabase
      .from("food_items")
      .select("id")
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    const { data: insertedItems, error: insertError } = await supabase
      .from("food_items")
      .insert(MOCK_ITEMS)
      .select();

    if (insertError) throw insertError;
    console.log(`Successfully seeded ${insertedItems.length} food items!`);
  } catch (err) {
    console.error("Food items seeding failed:", err.message);
  }
}

seed();
