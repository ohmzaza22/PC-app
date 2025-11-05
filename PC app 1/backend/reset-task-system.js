import { sql } from './src/config/db.js';

async function resetTaskSystem() {
  try {
    console.log('🔄 Resetting task management system...\n');
    
    // 1. Drop existing tables
    console.log('1️⃣ Dropping old tables...');
    await sql`DROP TABLE IF EXISTS tasks CASCADE`;
    await sql`DROP TABLE IF EXISTS task_batches CASCADE`;
    console.log('✅ Old tables dropped\n');
    
    // 2. Create task_batches table
    console.log('2️⃣ Creating task_batches table...');
    await sql`
      CREATE TABLE task_batches (
        id SERIAL PRIMARY KEY,
        assigned_by_mc_id INT NOT NULL REFERENCES users(id),
        assigned_to_pc_id INT NOT NULL REFERENCES users(id),
        store_id INT NOT NULL REFERENCES stores(id),
        batch_name TEXT,
        note TEXT,
        priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
        status TEXT CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ task_batches created\n');
    
    // 3. Create tasks table
    console.log('3️⃣ Creating tasks table...');
    await sql`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        batch_id INT NOT NULL REFERENCES task_batches(id) ON DELETE CASCADE,
        store_id INT NOT NULL REFERENCES stores(id),
        type TEXT NOT NULL CHECK (type IN ('OSA', 'SPECIAL_DISPLAY', 'MARKET_INFORMATION')),
        title TEXT NOT NULL,
        description TEXT,
        assigned_by_mc_id INT NOT NULL REFERENCES users(id),
        assigned_to_pc_id INT NOT NULL REFERENCES users(id),
        task_date DATE NOT NULL,
        due_date DATE,
        priority TEXT CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'MEDIUM',
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED')) DEFAULT 'PENDING',
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        completed_at TIMESTAMP,
        reviewed_by INT REFERENCES users(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ tasks created\n');
    
    // 4. Create indexes
    console.log('4️⃣ Creating indexes...');
    await sql`CREATE INDEX idx_task_batches_mc ON task_batches(assigned_by_mc_id)`;
    await sql`CREATE INDEX idx_task_batches_pc ON task_batches(assigned_to_pc_id)`;
    await sql`CREATE INDEX idx_task_batches_store ON task_batches(store_id)`;
    await sql`CREATE INDEX idx_tasks_batch ON tasks(batch_id)`;
    await sql`CREATE INDEX idx_tasks_pc_status ON tasks(assigned_to_pc_id, status)`;
    await sql`CREATE INDEX idx_tasks_date ON tasks(task_date)`;
    console.log('✅ Indexes created\n');
    
    console.log('🎉 Task system reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetTaskSystem();
