import { sql } from "../config/db.js";

export async function createDisplay(req, res) {
  try {
    const { store_id, cost, display_type, remarks } = req.body;
    const pc_id = req.userId;
    const photo_url = req.file ? req.file.path : null;

    if (!store_id || !cost || !display_type) {
      return res.status(400).json({ message: "Store ID, cost, and display type are required" });
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

    const display = await sql`
      INSERT INTO displays(store_id, pc_id, cost, display_type, photo_url, visit_id)
      VALUES (${store_id}, ${pc_id}, ${cost}, ${display_type}, ${photo_url}, ${visit_id})
      RETURNING *
    `;

    res.status(201).json(display[0]);
  } catch (error) {
    console.error("Error creating display:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDisplays(req, res) {
  try {
    const { store_id, pc_id } = req.query;
    
    let displays;
    if (store_id) {
      displays = await sql`
        SELECT d.*, s.store_name, u.name as pc_name, v.name as verified_by_name
        FROM displays d
        LEFT JOIN stores s ON d.store_id = s.id
        LEFT JOIN users u ON d.pc_id = u.id
        LEFT JOIN users v ON d.verified_by = v.id
        WHERE d.store_id = ${store_id}
        ORDER BY d.created_at DESC
      `;
    } else if (pc_id) {
      displays = await sql`
        SELECT d.*, s.store_name, u.name as pc_name, v.name as verified_by_name
        FROM displays d
        LEFT JOIN stores s ON d.store_id = s.id
        LEFT JOIN users u ON d.pc_id = u.id
        LEFT JOIN users v ON d.verified_by = v.id
        WHERE d.pc_id = ${pc_id}
        ORDER BY d.created_at DESC
      `;
    } else {
      displays = await sql`
        SELECT d.*, s.store_name, u.name as pc_name, v.name as verified_by_name
        FROM displays d
        LEFT JOIN stores s ON d.store_id = s.id
        LEFT JOIN users u ON d.pc_id = u.id
        LEFT JOIN users v ON d.verified_by = v.id
        ORDER BY d.created_at DESC
      `;
    }

    res.status(200).json(displays);
  } catch (error) {
    console.error("Error fetching displays:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function verifyDisplay(req, res) {
  try {
    const { id } = req.params;
    const verified_by = req.userId;

    const display = await sql`
      UPDATE displays
      SET verified_by = ${verified_by}
      WHERE id = ${id}
      RETURNING *
    `;

    if (display.length === 0) {
      return res.status(404).json({ message: "Display not found" });
    }

    res.status(200).json(display[0]);
  } catch (error) {
    console.error("Error verifying display:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteDisplay(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM displays WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Display not found" });
    }

    res.status(200).json({ message: "Display deleted successfully" });
  } catch (error) {
    console.error("Error deleting display:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
