import { sql } from "../config/db.js";

export async function createStore(req, res) {
  try {
    const { store_name, location, assigned_pc_id } = req.body;

    if (!store_name) {
      return res.status(400).json({ message: "Store name is required" });
    }

    const store = await sql`
      INSERT INTO stores(store_name, location, assigned_pc_id)
      VALUES (${store_name}, ${JSON.stringify(location)}, ${assigned_pc_id})
      RETURNING *
    `;

    res.status(201).json(store[0]);
  } catch (error) {
    console.error("Error creating store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStores(req, res) {
  try {
    const { assigned_pc_id } = req.query;
    
    let stores;
    if (assigned_pc_id) {
      stores = await sql`
        SELECT s.*, u.name as pc_name, u.email as pc_email
        FROM stores s
        LEFT JOIN users u ON s.assigned_pc_id = u.id
        WHERE s.assigned_pc_id = ${assigned_pc_id}
        ORDER BY s.store_name ASC
      `;
    } else {
      stores = await sql`
        SELECT s.*, u.name as pc_name, u.email as pc_email
        FROM stores s
        LEFT JOIN users u ON s.assigned_pc_id = u.id
        ORDER BY s.store_name ASC
      `;
    }

    res.status(200).json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getStoreById(req, res) {
  try {
    const { id } = req.params;

    const store = await sql`
      SELECT s.*, u.name as pc_name, u.email as pc_email
      FROM stores s
      LEFT JOIN users u ON s.assigned_pc_id = u.id
      WHERE s.id = ${id}
    `;

    if (store.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json(store[0]);
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateStore(req, res) {
  try {
    const { id } = req.params;
    const { store_name, location, assigned_pc_id } = req.body;

    const store = await sql`
      UPDATE stores
      SET store_name = COALESCE(${store_name}, store_name),
          location = COALESCE(${JSON.stringify(location)}, location),
          assigned_pc_id = COALESCE(${assigned_pc_id}, assigned_pc_id)
      WHERE id = ${id}
      RETURNING *
    `;

    if (store.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json(store[0]);
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteStore(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM stores WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
