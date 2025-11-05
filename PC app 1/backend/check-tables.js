import { sql } from './src/config/db.js';

async function checkTables() {
  try {
    console.log('Checking if task_batches table exists...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('task_batches', 'tasks')
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('❌ Tables NOT found! Running migration...\n');
      
      // Read and run migration
      const fs = await import('fs/promises');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const migrationFile = path.join(__dirname, 'migrations', '003_task_management.sql');
      const script = await fs.readFile(migrationFile, 'utf-8');
      
      await sql.unsafe(script);
      console.log('✅ Migration completed!\n');
      
      // Check again
      const newTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('task_batches', 'tasks')
        ORDER BY table_name
      `;
      
      console.log('Tables now present:');
      newTables.forEach(t => console.log(`  - ${t.table_name}`));
      
    } else {
      console.log('✅ Tables found:');
      tables.forEach(t => console.log(`  - ${t.table_name}`));
      
      // Show table structure
      console.log('\n📋 task_batches columns:');
      const batchColumns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'task_batches'
        ORDER BY ordinal_position
      `;
      batchColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
      
      console.log('\n📋 tasks columns:');
      const taskColumns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tasks'
        ORDER BY ordinal_position
      `;
      taskColumns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
