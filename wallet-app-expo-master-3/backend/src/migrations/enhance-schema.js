import { sql } from "../config/db.js";

/**
 * Migration to enhance database schema for field force management
 * Adds check-in/check-out, approval workflow, and offline sync support
 */
export async function enhanceSchema() {
  try {
    console.log("Starting schema enhancement migration...");

    // 1. Add check-in/check-out tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS store_visits (
        id SERIAL PRIMARY KEY,
        store_id INT REFERENCES stores(id),
        pc_id INT REFERENCES users(id),
        check_in_time TIMESTAMP NOT NULL,
        check_in_location JSONB NOT NULL,
        check_out_time TIMESTAMP,
        check_out_location JSONB,
        status TEXT CHECK (status IN ('CHECKED_IN','CHECKED_OUT')) DEFAULT 'CHECKED_IN',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("✓ Created store_visits table");

    // 2. Add approval status to OSA records
    await sql`
      ALTER TABLE osa_records 
      ADD COLUMN IF NOT EXISTS status TEXT 
      CHECK (status IN ('PENDING','APPROVED','REJECTED')) DEFAULT 'PENDING'
    `;
    await sql`
      ALTER TABLE osa_records 
      ADD COLUMN IF NOT EXISTS reviewed_by INT REFERENCES users(id)
    `;
    await sql`
      ALTER TABLE osa_records 
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `;
    await sql`
      ALTER TABLE osa_records 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `;
    await sql`
      ALTER TABLE osa_records 
      ADD COLUMN IF NOT EXISTS visit_id INT REFERENCES store_visits(id)
    `;
    await sql`
      ALTER TABLE osa_records 
      ADD COLUMN IF NOT EXISTS gps_location JSONB
    `;
    console.log("✓ Enhanced osa_records table");

    // 3. Add approval status to displays
    await sql`
      ALTER TABLE displays 
      ADD COLUMN IF NOT EXISTS status TEXT 
      CHECK (status IN ('PENDING','APPROVED','REJECTED')) DEFAULT 'PENDING'
    `;
    await sql`
      ALTER TABLE displays 
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `;
    await sql`
      ALTER TABLE displays 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `;
    await sql`
      ALTER TABLE displays 
      ADD COLUMN IF NOT EXISTS visit_id INT REFERENCES store_visits(id)
    `;
    await sql`
      ALTER TABLE displays 
      ADD COLUMN IF NOT EXISTS gps_location JSONB
    `;
    console.log("✓ Enhanced displays table");

    // 4. Add approval status to surveys
    await sql`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS status TEXT 
      CHECK (status IN ('PENDING','APPROVED','REJECTED')) DEFAULT 'PENDING'
    `;
    await sql`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS reviewed_by INT REFERENCES users(id)
    `;
    await sql`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP
    `;
    await sql`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `;
    await sql`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS visit_id INT REFERENCES store_visits(id)
    `;
    await sql`
      ALTER TABLE surveys 
      ADD COLUMN IF NOT EXISTS gps_location JSONB
    `;
    console.log("✓ Enhanced surveys table");

    // 5. Create survey templates table for dynamic forms
    await sql`
      CREATE TABLE IF NOT EXISTS survey_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        questions JSONB NOT NULL,
        assigned_stores JSONB,
        assigned_campaigns TEXT[],
        created_by INT REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("✓ Created survey_templates table");

    // 6. Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT CHECK (type IN ('PROMOTION','REJECTION','REMINDER','APPROVAL','GENERAL')),
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("✓ Created notifications table");

    // 7. Create offline sync queue table
    await sql`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        action_type TEXT NOT NULL,
        table_name TEXT NOT NULL,
        data JSONB NOT NULL,
        sync_status TEXT CHECK (sync_status IN ('PENDING','SYNCED','FAILED')) DEFAULT 'PENDING',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        synced_at TIMESTAMP
      )
    `;
    console.log("✓ Created sync_queue table");

    // 8. Add campaign field to promotions
    await sql`
      ALTER TABLE promotions 
      ADD COLUMN IF NOT EXISTS campaign_name TEXT
    `;
    await sql`
      ALTER TABLE promotions 
      ADD COLUMN IF NOT EXISTS assigned_stores JSONB
    `;
    console.log("✓ Enhanced promotions table");

    // 9. Create dashboard stats view (for performance)
    await sql`
      CREATE OR REPLACE VIEW dashboard_stats AS
      SELECT 
        u.id as user_id,
        u.role,
        COUNT(DISTINCT sv.id) FILTER (WHERE DATE(sv.check_in_time) = CURRENT_DATE) as today_visits,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PENDING') as pending_osa,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'PENDING') as pending_displays,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'PENDING') as pending_surveys,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'APPROVED' AND DATE(o.created_at) = CURRENT_DATE) as today_approved_osa,
        COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'APPROVED' AND DATE(d.created_at) = CURRENT_DATE) as today_approved_displays,
        COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'APPROVED' AND DATE(s.created_at) = CURRENT_DATE) as today_approved_surveys
      FROM users u
      LEFT JOIN store_visits sv ON u.id = sv.pc_id
      LEFT JOIN osa_records o ON u.id = o.pc_id
      LEFT JOIN displays d ON u.id = d.pc_id
      LEFT JOIN surveys s ON u.id = s.pc_id
      GROUP BY u.id, u.role
    `;
    console.log("✓ Created dashboard_stats view");

    // 10. Add indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_store_visits_pc ON store_visits(pc_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_store_visits_store ON store_visits(store_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_store_visits_date ON store_visits(check_in_time)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_osa_status ON osa_records(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_displays_status ON displays(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id, sync_status)`;
    console.log("✓ Created performance indexes");

    console.log("✅ Schema enhancement completed successfully!");
  } catch (error) {
    console.error("❌ Error during schema enhancement:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  enhanceSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
