import { sql } from "../config/db.js";

export async function createSurvey(req, res) {
  try {
    const { template_name, store_id, data } = req.body;
    const clerkUserId = req.userId; // This is the Clerk ID (string)
    
    // Get the database user ID from Clerk ID
    const user = await sql`
      SELECT id FROM users WHERE clerk_id = ${clerkUserId}
    `;
    
    if (!user || user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const pc_id = user[0].id; // This is the database ID (integer)
    
    // For local storage, use relative path; for Cloudinary, use full path
    let photo_url = null;
    if (req.file) {
      if (req.file.path && !req.file.path.startsWith('http')) {
        photo_url = `uploads/${req.file.filename}`;
      } else {
        photo_url = req.file.path;
      }
    }

    if (!template_name || !store_id || !data) {
      return res.status(400).json({ message: "Template name, store ID, and data are required" });
    }

    // Get current visit for this PC at this store
    const visit = await sql`
      SELECT id FROM store_visits
      WHERE pc_id = ${pc_id}
      AND store_id = ${store_id}
      AND status = 'CHECKED_IN'
      AND DATE(check_in_time) = CURRENT_DATE
      ORDER BY check_in_time DESC
      LIMIT 1
    `;

    const visit_id = visit.length > 0 ? visit[0].id : null;

    const survey = await sql`
      INSERT INTO surveys(template_name, store_id, pc_id, data, photo_url, visit_id)
      VALUES (${template_name}, ${store_id}, ${pc_id}, ${JSON.stringify(data)}, ${photo_url}, ${visit_id})
      RETURNING *
    `;

    // Update task assignment if visit exists
    if (visit_id) {
      await sql`
        UPDATE task_assignments
        SET 
          status = 'COMPLETED',
          completed_at = NOW(),
          task_record_id = ${survey[0].id}
        WHERE visit_id = ${visit_id}
          AND task_type = 'SURVEY'
          AND status != 'COMPLETED'
      `;
      
      console.log('✅ SURVEY task marked as completed for visit:', visit_id);
    }

    res.status(201).json(survey[0]);
  } catch (error) {
    console.error("Error creating survey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSurveys(req, res) {
  try {
    const { template_name, store_id, pc_id } = req.query;
    
    let surveys;
    if (template_name) {
      surveys = await sql`
        SELECT s.*, st.store_name, u.name as pc_name
        FROM surveys s
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.pc_id = u.id
        WHERE s.template_name = ${template_name}
        ORDER BY s.created_at DESC
      `;
    } else if (store_id) {
      surveys = await sql`
        SELECT s.*, st.store_name, u.name as pc_name
        FROM surveys s
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.pc_id = u.id
        WHERE s.store_id = ${store_id}
        ORDER BY s.created_at DESC
      `;
    } else if (pc_id) {
      surveys = await sql`
        SELECT s.*, st.store_name, u.name as pc_name
        FROM surveys s
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.pc_id = u.id
        WHERE s.pc_id = ${pc_id}
        ORDER BY s.created_at DESC
      `;
    } else {
      surveys = await sql`
        SELECT s.*, st.store_name, u.name as pc_name
        FROM surveys s
        LEFT JOIN stores st ON s.store_id = st.id
        LEFT JOIN users u ON s.pc_id = u.id
        ORDER BY s.created_at DESC
      `;
    }

    res.status(200).json(surveys);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSurveyById(req, res) {
  try {
    const { id } = req.params;

    const survey = await sql`
      SELECT s.*, st.store_name, st.location, u.name as pc_name, u.email as pc_email
      FROM surveys s
      LEFT JOIN stores st ON s.store_id = st.id
      LEFT JOIN users u ON s.pc_id = u.id
      WHERE s.id = ${id}
    `;

    if (survey.length === 0) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.status(200).json(survey[0]);
  } catch (error) {
    console.error("Error fetching survey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteSurvey(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM surveys WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.status(200).json({ message: "Survey deleted successfully" });
  } catch (error) {
    console.error("Error deleting survey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
