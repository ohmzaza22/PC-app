import { sql } from "../config/db.js";

export async function createPromotion(req, res) {
  try {
    const { title, valid_from, valid_to } = req.body;
    const uploaded_by = req.userId;
    const pdf_url = req.file ? req.file.path : null;

    if (!title || !valid_from || !valid_to) {
      return res.status(400).json({ message: "Title, valid_from, and valid_to are required" });
    }

    const promotion = await sql`
      INSERT INTO promotions(title, pdf_url, uploaded_by, valid_from, valid_to)
      VALUES (${title}, ${pdf_url}, ${uploaded_by}, ${valid_from}, ${valid_to})
      RETURNING *
    `;

    res.status(201).json(promotion[0]);
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPromotions(req, res) {
  try {
    const { active } = req.query;
    
    let promotions;
    if (active === "true") {
      const today = new Date().toISOString().split('T')[0];
      promotions = await sql`
        SELECT p.*, u.name as uploaded_by_name
        FROM promotions p
        LEFT JOIN users u ON p.uploaded_by = u.id
        WHERE p.valid_from <= ${today} AND p.valid_to >= ${today}
        ORDER BY p.created_at DESC
      `;
    } else {
      promotions = await sql`
        SELECT p.*, u.name as uploaded_by_name
        FROM promotions p
        LEFT JOIN users u ON p.uploaded_by = u.id
        ORDER BY p.created_at DESC
      `;
    }

    res.status(200).json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPromotionById(req, res) {
  try {
    const { id } = req.params;

    const promotion = await sql`
      SELECT p.*, u.name as uploaded_by_name, u.email as uploaded_by_email
      FROM promotions p
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE p.id = ${id}
    `;

    if (promotion.length === 0) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.status(200).json(promotion[0]);
  } catch (error) {
    console.error("Error fetching promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletePromotion(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM promotions WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
