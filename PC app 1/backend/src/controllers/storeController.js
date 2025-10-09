import { sql } from "../config/db.js";

export async function createStore(req, res) {
  try {
    const { 
      store_name, 
      store_code, 
      location, 
      store_type, 
      contact_person, 
      phone_number, 
      assigned_pc_id 
    } = req.body;

    if (!store_name) {
      return res.status(400).json({ message: "Store name is required" });
    }

    if (!store_code) {
      return res.status(400).json({ message: "Store code is required" });
    }

    // Check if store code already exists
    const existingStore = await sql`
      SELECT id FROM stores WHERE store_code = ${store_code}
    `;

    if (existingStore.length > 0) {
      return res.status(400).json({ message: "Store code already exists" });
    }

    const store = await sql`
      INSERT INTO stores(
        store_name, 
        store_code, 
        location, 
        store_type, 
        contact_person, 
        phone_number, 
        assigned_pc_id
      )
      VALUES (
        ${store_name}, 
        ${store_code}, 
        ${JSON.stringify(location)}, 
        ${store_type || 'RETAIL'}, 
        ${contact_person}, 
        ${phone_number}, 
        ${assigned_pc_id}
      )
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
    const { 
      store_name, 
      store_code, 
      location, 
      store_type, 
      contact_person, 
      phone_number, 
      assigned_pc_id 
    } = req.body;

    // If store_code is being updated, check if it already exists
    if (store_code) {
      const existingStore = await sql`
        SELECT id FROM stores WHERE store_code = ${store_code} AND id != ${id}
      `;

      if (existingStore.length > 0) {
        return res.status(400).json({ message: "Store code already exists" });
      }
    }

    const store = await sql`
      UPDATE stores
      SET store_name = COALESCE(${store_name}, store_name),
          store_code = COALESCE(${store_code}, store_code),
          location = COALESCE(${location ? JSON.stringify(location) : null}, location),
          store_type = COALESCE(${store_type}, store_type),
          contact_person = COALESCE(${contact_person}, contact_person),
          phone_number = COALESCE(${phone_number}, phone_number),
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
