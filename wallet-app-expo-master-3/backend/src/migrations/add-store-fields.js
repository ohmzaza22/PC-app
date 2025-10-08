import { sql } from "../config/db.js";

/**
 * Migration to add new fields to stores table
 * Run this once to update existing database
 */
export async function migrateStoreFields() {
  try {
    console.log("Starting store fields migration...");

    // Add store_code column if it doesn't exist
    await sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS store_code TEXT UNIQUE
    `;
    console.log("✓ Added store_code column");

    // Add store_type column if it doesn't exist
    await sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS store_type TEXT 
      CHECK (store_type IN ('RETAIL','HOSPITAL','PHARMACY','SUPERMARKET','CONVENIENCE','OTHER'))
    `;
    console.log("✓ Added store_type column");

    // Add contact_person column if it doesn't exist
    await sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS contact_person TEXT
    `;
    console.log("✓ Added contact_person column");

    // Add phone_number column if it doesn't exist
    await sql`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS phone_number TEXT
    `;
    console.log("✓ Added phone_number column");

    console.log("✅ Store fields migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateStoreFields()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
