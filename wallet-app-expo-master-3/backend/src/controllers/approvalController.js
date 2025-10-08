import { sql } from "../config/db.js";

// Get pending approvals for supervisor
export async function getPendingApprovals(req, res) {
  try {
    const { type, pc_id, store_id } = req.query;
    const userRole = req.user.role;

    if (userRole !== 'SUPERVISOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ message: "Access denied" });
    }

    let pendingOSA = [];
    let pendingDisplays = [];
    let pendingSurveys = [];

    // Get pending OSA records
    if (!type || type === 'osa') {
      let osaQuery = sql`
        SELECT 
          o.*,
          s.store_name,
          s.location as store_location,
          u.name as pc_name,
          u.email as pc_email,
          sv.check_in_time,
          sv.check_out_time
        FROM osa_records o
        JOIN stores s ON o.store_id = s.id
        JOIN users u ON o.pc_id = u.id
        LEFT JOIN store_visits sv ON o.visit_id = sv.id
        WHERE o.status = 'PENDING'
      `;

      if (pc_id) osaQuery = sql`${osaQuery} AND o.pc_id = ${pc_id}`;
      if (store_id) osaQuery = sql`${osaQuery} AND o.store_id = ${store_id}`;
      
      osaQuery = sql`${osaQuery} ORDER BY o.created_at DESC`;
      pendingOSA = await osaQuery;
    }

    // Get pending displays
    if (!type || type === 'display') {
      let displayQuery = sql`
        SELECT 
          d.*,
          s.store_name,
          s.location as store_location,
          u.name as pc_name,
          u.email as pc_email,
          sv.check_in_time,
          sv.check_out_time
        FROM displays d
        JOIN stores s ON d.store_id = s.id
        JOIN users u ON d.pc_id = u.id
        LEFT JOIN store_visits sv ON d.visit_id = sv.id
        WHERE d.status = 'PENDING'
      `;

      if (pc_id) displayQuery = sql`${displayQuery} AND d.pc_id = ${pc_id}`;
      if (store_id) displayQuery = sql`${displayQuery} AND d.store_id = ${store_id}`;
      
      displayQuery = sql`${displayQuery} ORDER BY d.created_at DESC`;
      pendingDisplays = await displayQuery;
    }

    // Get pending surveys
    if (!type || type === 'survey') {
      let surveyQuery = sql`
        SELECT 
          su.*,
          s.store_name,
          s.location as store_location,
          u.name as pc_name,
          u.email as pc_email,
          sv.check_in_time,
          sv.check_out_time
        FROM surveys su
        JOIN stores s ON su.store_id = s.id
        JOIN users u ON su.pc_id = u.id
        LEFT JOIN store_visits sv ON su.visit_id = sv.id
        WHERE su.status = 'PENDING'
      `;

      if (pc_id) surveyQuery = sql`${surveyQuery} AND su.pc_id = ${pc_id}`;
      if (store_id) surveyQuery = sql`${surveyQuery} AND su.store_id = ${store_id}`;
      
      surveyQuery = sql`${surveyQuery} ORDER BY su.created_at DESC`;
      pendingSurveys = await surveyQuery;
    }

    res.status(200).json({
      osa: pendingOSA,
      displays: pendingDisplays,
      surveys: pendingSurveys,
      total: pendingOSA.length + pendingDisplays.length + pendingSurveys.length,
    });
  } catch (error) {
    console.error("Error getting pending approvals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Approve OSA record
export async function approveOSA(req, res) {
  try {
    const { id } = req.params;
    const reviewer_id = req.user.id;

    const result = await sql`
      UPDATE osa_records
      SET status = 'APPROVED',
          reviewed_by = ${reviewer_id},
          reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "OSA record not found" });
    }

    // TODO: Send notification to PC
    res.status(200).json({ 
      message: "OSA record approved",
      record: result[0]
    });
  } catch (error) {
    console.error("Error approving OSA:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Reject OSA record
export async function rejectOSA(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewer_id = req.user.id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const result = await sql`
      UPDATE osa_records
      SET status = 'REJECTED',
          reviewed_by = ${reviewer_id},
          reviewed_at = NOW(),
          rejection_reason = ${reason}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "OSA record not found" });
    }

    // TODO: Send notification to PC
    res.status(200).json({ 
      message: "OSA record rejected",
      record: result[0]
    });
  } catch (error) {
    console.error("Error rejecting OSA:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Approve Display
export async function approveDisplay(req, res) {
  try {
    const { id } = req.params;
    const reviewer_id = req.user.id;

    const result = await sql`
      UPDATE displays
      SET status = 'APPROVED',
          verified_by = ${reviewer_id},
          reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Display not found" });
    }

    res.status(200).json({ 
      message: "Display approved",
      record: result[0]
    });
  } catch (error) {
    console.error("Error approving display:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Reject Display
export async function rejectDisplay(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewer_id = req.user.id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const result = await sql`
      UPDATE displays
      SET status = 'REJECTED',
          verified_by = ${reviewer_id},
          reviewed_at = NOW(),
          rejection_reason = ${reason}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Display not found" });
    }

    res.status(200).json({ 
      message: "Display rejected",
      record: result[0]
    });
  } catch (error) {
    console.error("Error rejecting display:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Approve Survey
export async function approveSurvey(req, res) {
  try {
    const { id } = req.params;
    const reviewer_id = req.user.id;

    const result = await sql`
      UPDATE surveys
      SET status = 'APPROVED',
          reviewed_by = ${reviewer_id},
          reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.status(200).json({ 
      message: "Survey approved",
      record: result[0]
    });
  } catch (error) {
    console.error("Error approving survey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Reject Survey
export async function rejectSurvey(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewer_id = req.user.id;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const result = await sql`
      UPDATE surveys
      SET status = 'REJECTED',
          reviewed_by = ${reviewer_id},
          reviewed_at = NOW(),
          rejection_reason = ${reason}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Survey not found" });
    }

    res.status(200).json({ 
      message: "Survey rejected",
      record: result[0]
    });
  } catch (error) {
    console.error("Error rejecting survey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get rejected tasks for PC (for resubmission)
export async function getRejectedTasks(req, res) {
  try {
    const pc_id = req.user.id;

    const rejectedOSA = await sql`
      SELECT 
        o.*,
        s.store_name,
        s.location as store_location,
        u.name as reviewer_name
      FROM osa_records o
      JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON o.reviewed_by = u.id
      WHERE o.pc_id = ${pc_id}
      AND o.status = 'REJECTED'
      ORDER BY o.reviewed_at DESC
    `;

    const rejectedDisplays = await sql`
      SELECT 
        d.*,
        s.store_name,
        s.location as store_location,
        u.name as reviewer_name
      FROM displays d
      JOIN stores s ON d.store_id = s.id
      LEFT JOIN users u ON d.verified_by = u.id
      WHERE d.pc_id = ${pc_id}
      AND d.status = 'REJECTED'
      ORDER BY d.reviewed_at DESC
    `;

    const rejectedSurveys = await sql`
      SELECT 
        su.*,
        s.store_name,
        s.location as store_location,
        u.name as reviewer_name
      FROM surveys su
      JOIN stores s ON su.store_id = s.id
      LEFT JOIN users u ON su.reviewed_by = u.id
      WHERE su.pc_id = ${pc_id}
      AND su.status = 'REJECTED'
      ORDER BY su.reviewed_at DESC
    `;

    res.status(200).json({
      osa: rejectedOSA,
      displays: rejectedDisplays,
      surveys: rejectedSurveys,
      total: rejectedOSA.length + rejectedDisplays.length + rejectedSurveys.length,
    });
  } catch (error) {
    console.error("Error getting rejected tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get approval statistics
export async function getApprovalStats(req, res) {
  try {
    const { start_date, end_date, pc_id } = req.query;
    const userRole = req.user.role;

    let dateFilter = sql``;
    if (start_date) dateFilter = sql`${dateFilter} AND DATE(created_at) >= ${start_date}`;
    if (end_date) dateFilter = sql`${dateFilter} AND DATE(created_at) <= ${end_date}`;

    let pcFilter = sql``;
    if (userRole === 'PC') {
      pcFilter = sql` AND pc_id = ${req.user.id}`;
    } else if (pc_id) {
      pcFilter = sql` AND pc_id = ${pc_id}`;
    }

    const stats = await sql`
      SELECT 
        'OSA' as type,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
        COUNT(*) as total
      FROM osa_records
      WHERE 1=1 ${dateFilter} ${pcFilter}
      
      UNION ALL
      
      SELECT 
        'Display' as type,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
        COUNT(*) as total
      FROM displays
      WHERE 1=1 ${dateFilter} ${pcFilter}
      
      UNION ALL
      
      SELECT 
        'Survey' as type,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
        COUNT(*) as total
      FROM surveys
      WHERE 1=1 ${dateFilter} ${pcFilter}
    `;

    res.status(200).json({ stats });
  } catch (error) {
    console.error("Error getting approval stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
