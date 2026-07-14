"use server";

import { query } from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function loginAdmin(username: string, password: string) {
  try {
    const result = await query(
      "SELECT * FROM admin_users WHERE username = $1 AND password = $2",
      [username, password]
    );
    return { success: result.rows.length > 0 };
  } catch (err) {
    console.error("Login verification error:", err);
    return { error: err instanceof Error ? err.message : "Database error" };
  }
}

export async function getFoodItems(search: string, limit: number, offset: number) {
  try {
    let sql = "SELECT * FROM food_items";
    const params: any[] = [];
    
    if (search.trim()) {
      sql += " WHERE name ILIKE $1";
      params.push(`%${search.trim()}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit, offset);

    const result = await query(sql, params);
    return { data: result.rows };
  } catch (err) {
    console.error("Fetch items error:", err);
    return { error: err instanceof Error ? err.message : "Could not load food items" };
  }
}

export async function getAllFoodItems() {
  try {
    const result = await query("SELECT * FROM food_items ORDER BY created_at DESC");
    return { data: result.rows };
  } catch (err) {
    console.error("Fetch all items error:", err);
    return { error: err instanceof Error ? err.message : "Could not load food items" };
  }
}

export async function addFoodItem(name: string, price: number, photo_url: string) {
  try {
    const result = await query(
      "INSERT INTO food_items (name, price, photo_url) VALUES ($1, $2, $3) RETURNING *",
      [name, price, photo_url]
    );
    return { data: result.rows[0] };
  } catch (err) {
    console.error("Add food item error:", err);
    return { error: err instanceof Error ? err.message : "Failed to add food item" };
  }
}

export async function updateFoodItem(id: string, name: string, price: number, photo_url: string) {
  try {
    const result = await query(
      "UPDATE food_items SET name = $1, price = $2, photo_url = $3 WHERE id = $4 RETURNING *",
      [name, price, photo_url, id]
    );
    return { data: result.rows[0] };
  } catch (err) {
    console.error("Update food item error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update food item" };
  }
}

export async function deleteFoodItem(id: string) {
  try {
    await query("DELETE FROM food_items WHERE id = $1", [id]);
    return { success: true };
  } catch (err) {
    console.error("Delete food item error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete food item" };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    return { url: `/uploads/${fileName}` };
  } catch (err) {
    console.error("Image upload error:", err);
    return { error: "Failed to upload image" };
  }
}
