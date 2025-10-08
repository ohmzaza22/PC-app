import { sql } from "../config/db.js";

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check-in to a store
export async function checkIn(req, res) {
  try {
    const { store_id, location } = req.body;
    const pc_id = req.user.id;

    if (!store_id || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({ message: "Store ID and GPS location are required" });
    }

    // Get store location
    const store = await sql`
      SELECT id, location FROM stores WHERE id = ${store_id}
    `;

    if (store.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    const storeLocation = typeof store[0].location === 'string' 
      ? JSON.parse(store[0].location) 
      : store[0].location;

    // Validate GPS proximity (within 100 meters)
    const maxDistance = parseInt(process.env.GPS_VALIDATION_RADIUS_METERS || "100");
    
    if (storeLocation.latitude && storeLocation.longitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        parseFloat(storeLocation.latitude),
        parseFloat(storeLocation.longitude)
      );

      if (distance > maxDistance) {
        return res.status(400).json({ 
          message: `You must be within ${maxDistance}m of the store to check in`,
          distance: Math.round(distance),
          maxDistance
        });
      }
    }

    // Check if already checked in
    const existingVisit = await sql`
      SELECT id FROM store_visits 
      WHERE pc_id = ${pc_id} 
      AND store_id = ${store_id} 
      AND status = 'CHECKED_IN'
      AND DATE(check_in_time) = CURRENT_DATE
    `;

    if (existingVisit.length > 0) {
      return res.status(400).json({ 
        message: "You are already checked in to this store",
        visit_id: existingVisit[0].id
      });
    }

    // Create check-in record
    const visit = await sql`
      INSERT INTO store_visits(store_id, pc_id, check_in_time, check_in_location, status)
      VALUES (${store_id}, ${pc_id}, NOW(), ${JSON.stringify(location)}, 'CHECKED_IN')
      RETURNING *
    `;

    res.status(201).json({
      message: "Checked in successfully",
      visit: visit[0]
    });
  } catch (error) {
    console.error("Error checking in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Check-out from a store
export async function checkOut(req, res) {
  try {
    const { visit_id, location } = req.body;
    const pc_id = req.user.id;

    if (!visit_id || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({ message: "Visit ID and GPS location are required" });
    }

    // Get visit record
    const visit = await sql`
      SELECT * FROM store_visits 
      WHERE id = ${visit_id} 
      AND pc_id = ${pc_id}
      AND status = 'CHECKED_IN'
    `;

    if (visit.length === 0) {
      return res.status(404).json({ message: "Active check-in not found" });
    }

    // Update check-out
    const updatedVisit = await sql`
      UPDATE store_visits
      SET check_out_time = NOW(),
          check_out_location = ${JSON.stringify(location)},
          status = 'CHECKED_OUT'
      WHERE id = ${visit_id}
      RETURNING *
    `;

    res.status(200).json({
      message: "Checked out successfully",
      visit: updatedVisit[0]
    });
  } catch (error) {
    console.error("Error checking out:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get current active visit for PC
export async function getCurrentVisit(req, res) {
  try {
    const pc_id = req.user.id;

    const visit = await sql`
      SELECT 
        sv.*,
        s.store_name,
        s.location as store_location
      FROM store_visits sv
      JOIN stores s ON sv.store_id = s.id
      WHERE sv.pc_id = ${pc_id}
      AND sv.status = 'CHECKED_IN'
      AND DATE(sv.check_in_time) = CURRENT_DATE
      ORDER BY sv.check_in_time DESC
      LIMIT 1
    `;

    if (visit.length === 0) {
      return res.status(200).json({ visit: null });
    }

    res.status(200).json({ visit: visit[0] });
  } catch (error) {
    console.error("Error getting current visit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get visit history
export async function getVisitHistory(req, res) {
  try {
    const { pc_id, store_id, start_date, end_date } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = sql`
      SELECT 
        sv.*,
        s.store_name,
        s.location as store_location,
        u.name as pc_name,
        u.email as pc_email
      FROM store_visits sv
      JOIN stores s ON sv.store_id = s.id
      JOIN users u ON sv.pc_id = u.id
      WHERE 1=1
    `;

    // Role-based filtering
    if (userRole === 'PC') {
      query = sql`${query} AND sv.pc_id = ${userId}`;
    } else if (pc_id) {
      query = sql`${query} AND sv.pc_id = ${pc_id}`;
    }

    if (store_id) {
      query = sql`${query} AND sv.store_id = ${store_id}`;
    }

    if (start_date) {
      query = sql`${query} AND DATE(sv.check_in_time) >= ${start_date}`;
    }

    if (end_date) {
      query = sql`${query} AND DATE(sv.check_in_time) <= ${end_date}`;
    }

    query = sql`${query} ORDER BY sv.check_in_time DESC LIMIT 100`;

    const visits = await query;

    res.status(200).json({ visits });
  } catch (error) {
    console.error("Error getting visit history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Validate if PC can perform tasks (must be checked in)
export async function validateTaskAccess(req, res) {
  try {
    const { store_id } = req.query;
    const pc_id = req.user.id;

    if (!store_id) {
      return res.status(400).json({ message: "Store ID is required" });
    }

    const visit = await sql`
      SELECT id FROM store_visits 
      WHERE pc_id = ${pc_id}
      AND store_id = ${store_id}
      AND status = 'CHECKED_IN'
      AND DATE(check_in_time) = CURRENT_DATE
    `;

    if (visit.length === 0) {
      return res.status(403).json({ 
        canAccess: false,
        message: "You must check in to this store before performing tasks"
      });
    }

    res.status(200).json({ 
      canAccess: true,
      visit_id: visit[0].id
    });
  } catch (error) {
    console.error("Error validating task access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
