import { sql } from './src/config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

async function dropAndMigrate() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    console.log('⚠️  Dropping existing task tables...');
    
    // Drop tables in reverse order (due to foreign keys)
    await sql`DROP TABLE IF EXISTS tasks CASCADE`;
    await sql`DROP TABLE IF EXISTS task_batches CASCADE`;
    
    console.log('✅ Tables dropped successfully.');
    console.log('\n📦 Running migrations...');
    
    // Read and run the task management migration
    const migrationFile = path.join(migrationsDir, '003_task_management.sql');
    const script = await fs.readFile(migrationFile, 'utf-8');
    
    await sql.unsafe(script);
    console.log('✅ Migration 003_task_management.sql completed successfully.');
    
    console.log('\n🎉 All done! Tables recreated with correct schema.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropAndMigrate();
