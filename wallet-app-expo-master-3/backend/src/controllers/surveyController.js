import { sql } from "../config/db.js";

export async function createSurvey(req, res) {
  try {
    const { template_name, store_id, data } = req.body;
    const pc_id = req.userId;
    const photo_url = req.file ? req.file.path : null;

    if (!template_name || !store_id || !data) {
      return res.status(400).json({ message: "Template name, store ID, and data are required" });
    }

    const survey = await sql`
      INSERT INTO surveys(template_name, store_id, pc_id, data, photo_url)
      VALUES (${template_name}, ${store_id}, ${pc_id}, ${JSON.stringify(data)}, ${photo_url})
      RETURNING *
    `;

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
