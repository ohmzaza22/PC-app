import { neon } from "@neondatabase/serverless";

import "dotenv/config";

// Creates a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // Users table
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      role TEXT CHECK (role IN ('PC','SUPERVISOR','ADMIN','SALES','VENDOR')),
      clerk_id TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // Stores table
    await sql`CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      store_name TEXT NOT NULL,
      store_code TEXT UNIQUE,
      location JSONB,
      store_type TEXT CHECK (store_type IN ('RETAIL','HOSPITAL','PHARMACY','SUPERMARKET','CONVENIENCE','OTHER')),
      contact_person TEXT,
      phone_number TEXT,
      assigned_pc_id INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // OSA Records table
    await sql`CREATE TABLE IF NOT EXISTS osa_records (
      id SERIAL PRIMARY KEY,
      store_id INT REFERENCES stores(id),
      pc_id INT REFERENCES users(id),
      checkin_time TIMESTAMP DEFAULT NOW(),
      photo_url TEXT,
      remarks TEXT,
      availability JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // Displays table
    await sql`CREATE TABLE IF NOT EXISTS displays (
      id SERIAL PRIMARY KEY,
      store_id INT REFERENCES stores(id),
      pc_id INT REFERENCES users(id),
      cost NUMERIC(10,2),
      display_type TEXT,
      photo_url TEXT,
      verified_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // Surveys table
    await sql`CREATE TABLE IF NOT EXISTS surveys (
      id SERIAL PRIMARY KEY,
      template_name TEXT NOT NULL,
      store_id INT REFERENCES stores(id),
      pc_id INT REFERENCES users(id),
      data JSONB,
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // Promotions table
    await sql`CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      pdf_url TEXT,
      uploaded_by INT REFERENCES users(id),
      valid_from DATE,
      valid_to DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    console.log("PC Field App Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1); // status code 1 means failure, 0 success
  }
}
