import { sql } from './src/config/db.js';

async function testMigration() {
  try {
    console.log('🔍 Testing database connection...');
    
    const result = await sql`SELECT current_database(), current_user`;
    console.log(`✅ Connected to database: ${result[0].current_database}`);
    console.log(`   User: ${result[0].current_user}\n`);
    
    console.log('📦 Creating task_batches table manually...');
    
    // Create table step by step
    await sql`
      CREATE TABLE IF NOT EXISTS task_batches (
        id SERIAL PRIMARY KEY,
        assigned_by_mc_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        assigned_to_pc_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        store_id INT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ task_batches table created');
    
    console.log('\n📦 Creating tasks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        batch_id INT NOT NULL REFERENCES task_batches(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('OSA', 'SPECIAL_DISPLAY', 'MARKET_INFORMATION')),
        title TEXT NOT NULL,
        description TEXT,
        store_id INT NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
        task_date DATE,
        active_from TIMESTAMP,
        active_to TIMESTAMP,
        due_date DATE,
        attachments JSONB DEFAULT '[]'::jsonb,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
        assigned_by_mc_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        assigned_to_pc_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ tasks table created');
    
    console.log('\n📋 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('task_batches', 'tasks')
    `;
    
    console.log('Tables found:');
    tables.forEach(t => console.log(`  ✓ ${t.table_name}`));
    
    console.log('\n🎉 Success! Tables created and verified.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testMigration();
