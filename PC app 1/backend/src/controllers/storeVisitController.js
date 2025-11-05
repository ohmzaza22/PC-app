/**
 * Store Visit Controller
 * Handles check-in, check-out, and visit history operations
 */

import { sql } from '../config/db.js';
import { calculateDistance, parseLocation, getUserIdFromClerkId } from '../utils/helpers.js';
import { sendSuccess, sendCreated, sendError, sendValidationError, sendNotFound } from '../utils/response.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { GPS_CONFIG, VISIT_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/index.js';

/**
 * Check in to a store
 * @route POST /api/store-visits/check-in
 * @access Private (PC only)
 */
export async function checkIn(req, res) {
  try {
    const { store_id, location } = req.body;
    const pc_id = await getUserIdFromClerkId(sql, req.userId);

    // Validate required fields
    if (!store_id || !location?.latitude || !location?.longitude) {
      return sendValidationError(res, 'Store ID and GPS location are required');
    }

    // Get store location
    const store = await sql`
      SELECT id, location FROM stores WHERE id = ${store_id}
    `;

    if (store.length === 0) {
      return sendNotFound(res, 'Store');
    }

    // Validate GPS proximity
    const storeLocation = parseLocation(store[0].location);
    
    if (storeLocation?.latitude && storeLocation?.longitude) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        parseFloat(storeLocation.latitude),
        parseFloat(storeLocation.longitude)
      );

      if (distance > GPS_CONFIG.MAX_DISTANCE_METERS) {
        return sendValidationError(res, ERROR_MESSAGES.GPS_TOO_FAR, {
          distance: Math.round(distance),
          maxDistance: GPS_CONFIG.MAX_DISTANCE_METERS,
        });
      }
    }

    // Check if already checked in
    const existingVisit = await sql`
      SELECT id FROM store_visits 
      WHERE pc_id = ${pc_id} 
      AND store_id = ${store_id} 
      AND status = ${VISIT_STATUS.CHECKED_IN}
      AND DATE(check_in_time) = CURRENT_DATE
    `;

    if (existingVisit.length > 0) {
      return sendValidationError(res, ERROR_MESSAGES.ALREADY_CHECKED_IN, {
        visit_id: existingVisit[0].id,
      });
    }

    // Create check-in record
    const visit = await sql`
      INSERT INTO store_visits(store_id, pc_id, check_in_time, check_in_location, status)
      VALUES (${store_id}, ${pc_id}, NOW(), ${JSON.stringify(location)}, ${VISIT_STATUS.CHECKED_IN})
      RETURNING *
    `;

    sendCreated(res, { visit: visit[0] }, SUCCESS_MESSAGES.CHECKED_IN);
  } catch (error) {
    console.error('❌ Check-in error:', error);
    sendError(res, error.message);
  }
}

// Check-out from a store (with task completion validation)
export async function checkOut(req, res) {
  try {
    const { visit_id, location } = req.body;
    const pc_id = req.userId; // From clerkAuth middleware

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

    // Check if all required tasks are completed
    const incompleteTasks = await sql`
      SELECT task_type, status 
      FROM task_assignments 
      WHERE visit_id = ${visit_id}
      AND is_required = true
      AND status != 'COMPLETED'
    `;

    if (incompleteTasks.length > 0) {
      return res.status(400).json({ 
        message: "You must complete all required tasks before checking out",
        incompleteTasks: incompleteTasks.map(t => ({
          taskType: t.task_type,
          status: t.status
        }))
      });
    }

    // Update check-out
    const updatedVisit = await sql`
      UPDATE store_visits
      SET check_out_time = NOW(),
          check_out_location = ${JSON.stringify(location)},
          status = 'CHECKED_OUT',
          session_status = 'COMPLETED'
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

// Get current active visit for PC with task assignments
export async function getCurrentVisit(req, res) {
  try {
    const pc_id = req.userId; // From clerkAuth middleware

    const visit = await sql`
      SELECT 
        sv.*,
        s.store_name,
        s.location as store_location,
        u.name as pc_name,
        u.email as pc_email
      FROM store_visits sv
      JOIN stores s ON sv.store_id = s.id
      JOIN users u ON sv.pc_id = u.id
      WHERE sv.pc_id = ${pc_id}
      AND sv.status = 'CHECKED_IN'
      AND DATE(sv.check_in_time) = CURRENT_DATE
      ORDER BY sv.check_in_time DESC
      LIMIT 1
    `;

    if (visit.length === 0) {
      return res.status(200).json({ 
        visit: null,
        tasks: []
      });
    }

    // Get task assignments for this visit
    const tasks = await sql`
      SELECT 
        id,
        task_type,
        is_required,
        status,
        completed_at,
        task_record_id
      FROM task_assignments
      WHERE visit_id = ${visit[0].id}
      ORDER BY 
        CASE task_type
          WHEN 'OSA' THEN 1
          WHEN 'DISPLAY' THEN 2
          WHEN 'SURVEY' THEN 3
          WHEN 'PROMOTION' THEN 4
          ELSE 5
        END
    `;

    // Calculate completion stats
    const totalRequired = tasks.filter(t => t.is_required).length;
    const completedRequired = tasks.filter(t => t.is_required && t.status === 'COMPLETED').length;
    const canCheckOut = totalRequired === completedRequired;

    res.status(200).json({ 
      visit: visit[0],
      tasks: tasks,
      stats: {
        totalRequired,
        completedRequired,
        canCheckOut
      }
    });
  } catch (error) {
    console.error("Error getting current visit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get visit history
export async function getVisitHistory(req, res) {
  try {
    const { pc_id, store_id, start_date, end_date } = req.query;
    const userRole = req.userRole; // From clerkAuth middleware
    const userId = req.userId; // From clerkAuth middleware

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

// Cancel check-in (for wrong location check-ins)
export async function cancelCheckIn(req, res) {
  try {
    const { visit_id } = req.body;
    const pc_id = req.userId;

    if (!visit_id) {
      return res.status(400).json({ message: "Visit ID is required" });
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

    // Delete the check-in record and related task assignments
    await sql`
      DELETE FROM task_assignments WHERE visit_id = ${visit_id}
    `;

    await sql`
      DELETE FROM store_visits WHERE id = ${visit_id}
    `;

    res.status(200).json({
      message: "Check-in cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling check-in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Validate if PC can perform tasks (must be checked in)
export async function validateTaskAccess(req, res) {
  try {
    const { store_id } = req.query;
    const pc_id = req.userId; // From clerkAuth middleware

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
