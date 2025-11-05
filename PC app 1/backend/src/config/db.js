/**
 * =============================================================================
 * DATABASE CONFIGURATION
 * =============================================================================
 * 
 * จัดการการเชื่อมต่อ PostgreSQL Database (NeonDB) และ Migrations
 * 
 * Features:
 * - Serverless PostgreSQL connection (Neon)
 * - Auto-run migrations on startup
 * - Error handling และ graceful shutdown
 * 
 * @module config/db
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { neon } from "@neondatabase/serverless";  // Neon serverless PostgreSQL driver
import fs from 'fs/promises';                     // File system (promises API)
import path from 'path';                          // Path utilities
import { fileURLToPath } from 'url';              // URL to file path converter
import "dotenv/config";                           // Auto-load .env file

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

/**
 * SQL Connection Instance (NeonDB)
 * 
 * ใช้ Neon serverless driver เชื่อมต่อกับ PostgreSQL
 * - Auto-scaling
 * - Connection pooling
 * - Low latency
 * 
 * @type {Function} sql - SQL query function
 * @example
 * const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
 */
export const sql = neon(process.env.DATABASE_URL);

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================

/**
 * รัน Database Migrations
 * 
 * อ่านและรันไฟล์ .sql ทั้งหมดใน folder migrations/
 * เรียงลำดับตามชื่อไฟล์ (alphabetically)
 * 
 * Migration files ควรตั้งชื่อแบบ:
 * - 001_initial_schema.sql
 * - 002_add_tasks.sql
 * - 003_add_approvals.sql
 * 
 * @async
 * @function runMigrations
 * @throws {Error} ถ้า migration ล้มเหลว
 */
async function runMigrations() {
  // สร้าง path ไปยัง migrations folder
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  try {
    // อ่านไฟล์ทั้งหมดใน migrations directory
    const files = await fs.readdir(migrationsDir);
    
    // กรองเฉพาะไฟล์ .sql และเรียงลำดับ
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    console.log(`📋 Found ${sqlFiles.length} migration files.`);

    // รัน migrations ทีละไฟล์ตามลำดับ
    for (const file of sqlFiles) {
      console.log(`⚙️  Running migration: ${file}...`);
      
      // อ่านเนื้อหาไฟล์ SQL
      const filePath = path.join(migrationsDir, file);
      const script = await fs.readFile(filePath, 'utf-8');
      
      // Execute SQL script
      // ใช้ .unsafe() เพราะ migration files มี raw SQL
      await sql.unsafe(script);
      
      console.log(`✅ Migration ${file} completed successfully.`);
    }
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error; // Re-throw เพื่อให้ initDB() จัดการ
  }
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

/**
 * เริ่มต้น Database
 * 
 * ทำการ:
 * 1. รัน migrations ทั้งหมด
 * 2. ตรวจสอบการเชื่อมต่อ
 * 3. พิมพ์ข้อความสำเร็จ
 * 
 * ถ้าล้มเหลว:
 * - พิมพ์ error
 * - Exit process (เพราะ app ไม่สามารถทำงานได้โดยไม่มี DB)
 * 
 * @async
 * @function initDB
 * @returns {Promise<void>}
 */
export async function initDB() {
  try {
    console.log('🔧 Initializing database...');
    
    // รัน migrations ทั้งหมด
    await runMigrations();

    console.log("✅ PC Field App Database initialized successfully");
    console.log("🗄️  Database ready for operations");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    console.error("💥 Cannot start application without database");
    
    // Exit process เพราะ application ไม่สามารถทำงานได้
    // Exit code 1 = error
    process.exit(1);
  }
}
