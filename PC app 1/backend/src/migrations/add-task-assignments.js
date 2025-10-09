import { sql } from "../config/db.js";

/**
 * Migration to add task assignment system for check-in/check-out gating
 */
export async function addTaskAssignments() {
  try {
    console.log("Starting task assignment migration...");

    // 1. Create task_assignments table
    await sql`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        visit_id INT REFERENCES store_visits(id) ON DELETE CASCADE,
        task_type TEXT NOT NULL CHECK (task_type IN ('OSA','DISPLAY','SURVEY','PROMOTION')),
        is_required BOOLEAN DEFAULT true,
        status TEXT CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED')) DEFAULT 'PENDING',
        completed_at TIMESTAMP,
        task_record_id INT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("✓ Created task_assignments table");

    // 2. Add indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_task_assignments_visit ON task_assignments(visit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status)`;
    console.log("✓ Created indexes");

    // 3. Update store_visits table to add session status
    await sql`
      ALTER TABLE store_visits 
      ADD COLUMN IF NOT EXISTS session_status TEXT 
      CHECK (session_status IN ('IN_PROGRESS','COMPLETED','INCOMPLETE')) 
      DEFAULT 'IN_PROGRESS'
    `;
    console.log("✓ Enhanced store_visits table");

    // 4. Create function to auto-create task assignments on check-in
    await sql`
      CREATE OR REPLACE FUNCTION create_default_task_assignments()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Create default required tasks for each check-in
        INSERT INTO task_assignments (visit_id, task_type, is_required, status)
        VALUES 
          (NEW.id, 'OSA', true, 'PENDING'),
          (NEW.id, 'DISPLAY', true, 'PENDING'),
          (NEW.id, 'SURVEY', true, 'PENDING');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log("✓ Created task assignment function");

    // 5. Create trigger to auto-create tasks on check-in
    await sql`
      DROP TRIGGER IF EXISTS trigger_create_task_assignments ON store_visits;
    `;
    await sql`
      CREATE TRIGGER trigger_create_task_assignments
      AFTER INSERT ON store_visits
      FOR EACH ROW
      WHEN (NEW.status = 'CHECKED_IN')
      EXECUTE FUNCTION create_default_task_assignments();
    `;
    console.log("✓ Created trigger for auto task assignment");

    // 6. Create function to update task status when records are created
    await sql`
      CREATE OR REPLACE FUNCTION update_task_assignment_on_record()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update task assignment when a task record is created
        UPDATE task_assignments
        SET status = 'COMPLETED',
            completed_at = NOW(),
            task_record_id = NEW.id,
            updated_at = NOW()
        WHERE visit_id = NEW.visit_id
        AND task_type = TG_ARGV[0]
        AND status != 'COMPLETED';
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log("✓ Created task update function");

    // 7. Create triggers for each task type
    await sql`DROP TRIGGER IF EXISTS trigger_osa_task_complete ON osa_records;`;
    await sql`
      CREATE TRIGGER trigger_osa_task_complete
      AFTER INSERT ON osa_records
      FOR EACH ROW
      WHEN (NEW.visit_id IS NOT NULL)
      EXECUTE FUNCTION update_task_assignment_on_record('OSA');
    `;

    await sql`DROP TRIGGER IF EXISTS trigger_display_task_complete ON displays;`;
    await sql`
      CREATE TRIGGER trigger_display_task_complete
      AFTER INSERT ON displays
      FOR EACH ROW
      WHEN (NEW.visit_id IS NOT NULL)
      EXECUTE FUNCTION update_task_assignment_on_record('DISPLAY');
    `;

    await sql`DROP TRIGGER IF EXISTS trigger_survey_task_complete ON surveys;`;
    await sql`
      CREATE TRIGGER trigger_survey_task_complete
      AFTER INSERT ON surveys
      FOR EACH ROW
      WHEN (NEW.visit_id IS NOT NULL)
      EXECUTE FUNCTION update_task_assignment_on_record('SURVEY');
    `;
    console.log("✓ Created triggers for task completion tracking");

    console.log("✅ Task assignment migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during task assignment migration:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addTaskAssignments()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
