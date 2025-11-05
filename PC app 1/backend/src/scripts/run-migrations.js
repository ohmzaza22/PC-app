import { sql } from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

async function runMigrations() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Go up two levels from src/scripts to the backend root
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  
  try {
    console.log('Searching for migration files...');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('No migration files found. Database is up to date.');
      return;
    }

    console.log(`Found ${sqlFiles.length} migration files.`);

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const script = await fs.readFile(filePath, 'utf-8');
      
      // Execute the SQL script using sql.unsafe for multi-statement scripts
      await sql.unsafe(script);
      console.log(`✅ Migration ${file} completed successfully.`);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1); // Exit with an error code
  }
}

// Run the migration function and then exit
runMigrations().then(() => {
  console.log('Migration process finished.');
  process.exit(0);
}).catch(() => {
  // Error is already logged in runMigrations
});
