import { sql } from "../config/db.js";

export async function createOSARecord(req, res) {
  try {
    const { store_id, remarks, availability } = req.body;
    const pc_id = req.userId;
    const photo_url = req.file ? req.file.path : null;

    if (!store_id || !availability) {
      return res.status(400).json({ message: "Store ID and availability data are required" });
    }

    const record = await sql`
      INSERT INTO osa_records(store_id, pc_id, photo_url, remarks, availability)
      VALUES (${store_id}, ${pc_id}, ${photo_url}, ${remarks}, ${JSON.stringify(availability)})
      RETURNING *
    `;

    res.status(201).json(record[0]);
  } catch (error) {
    console.error("Error creating OSA record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOSARecords(req, res) {
  try {
    const { store_id, pc_id } = req.query;
    
    let records;
    if (store_id) {
      records = await sql`
        SELECT o.*, s.store_name, u.name as pc_name
        FROM osa_records o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN users u ON o.pc_id = u.id
        WHERE o.store_id = ${store_id}
        ORDER BY o.created_at DESC
      `;
    } else if (pc_id) {
      records = await sql`
        SELECT o.*, s.store_name, u.name as pc_name
        FROM osa_records o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN users u ON o.pc_id = u.id
        WHERE o.pc_id = ${pc_id}
        ORDER BY o.created_at DESC
      `;
    } else {
      records = await sql`
        SELECT o.*, s.store_name, u.name as pc_name
        FROM osa_records o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN users u ON o.pc_id = u.id
        ORDER BY o.created_at DESC
      `;
    }

    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching OSA records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOSARecordById(req, res) {
  try {
    const { id } = req.params;

    const record = await sql`
      SELECT o.*, s.store_name, s.location, u.name as pc_name, u.email as pc_email
      FROM osa_records o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON o.pc_id = u.id
      WHERE o.id = ${id}
    `;

    if (record.length === 0) {
      return res.status(404).json({ message: "OSA record not found" });
    }

    res.status(200).json(record[0]);
  } catch (error) {
    console.error("Error fetching OSA record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteOSARecord(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM osa_records WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "OSA record not found" });
    }

    res.status(200).json({ message: "OSA record deleted successfully" });
  } catch (error) {
    console.error("Error deleting OSA record:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
