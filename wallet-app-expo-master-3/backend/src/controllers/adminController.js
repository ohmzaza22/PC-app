import { sql } from '../config/db.js';

// Get dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    // Get total PCs
    const pcCount = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'PC'`;

    // Get today's OSA submissions
    const todayOSA = await sql`SELECT COUNT(*) as count FROM osa_records 
       WHERE DATE(created_at) = CURRENT_DATE`;

    // Get pending reviews (not verified)
    const pendingReviews = await sql`SELECT COUNT(*) as count FROM displays WHERE verified = false`;

    // Get active promotions
    const activePromotions = await sql`SELECT COUNT(*) as count FROM promotions 
       WHERE valid_to >= CURRENT_DATE AND valid_from <= CURRENT_DATE`;

    // Get OSA trend (last 7 days)
    const osaTrend = await sql`SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM osa_records 
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date`;

    // Get display spending trend (last 30 days)
    const displayTrend = await sql`SELECT DATE(created_at) as date, SUM(cost) as total 
       FROM displays 
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`;

    res.json({
      summary: {
        totalPCs: parseInt(pcCount[0].count),
        todayOSA: parseInt(todayOSA[0].count),
        pendingReviews: parseInt(pendingReviews[0].count),
        activePromotions: parseInt(activePromotions[0].count),
      },
      trends: {
        osa: osaTrend,
        display: displayTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
  }
};

// Export OSA report
export const exportOSAReport = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    let result;
    
    if (storeId && startDate && endDate) {
      result = await sql`
        SELECT 
          o.id,
          o.created_at,
          s.store_name,
          u.name as pc_name,
          o.photo_url,
          o.status
        FROM osa_records o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN users u ON o.pc_id = u.id
        WHERE o.store_id = ${storeId}
          AND o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        ORDER BY o.created_at DESC
      `;
    } else if (startDate && endDate) {
      result = await sql`
        SELECT 
          o.id,
          o.created_at,
          s.store_name,
          u.name as pc_name,
          o.photo_url,
          o.status
        FROM osa_records o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN users u ON o.pc_id = u.id
        WHERE o.created_at >= ${startDate}
          AND o.created_at <= ${endDate}
        ORDER BY o.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT 
          o.id,
          o.created_at,
          s.store_name,
          u.name as pc_name,
          o.photo_url,
          o.status
        FROM osa_records o
        LEFT JOIN stores s ON o.store_id = s.id
        LEFT JOIN users u ON o.pc_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 100
      `;
    }

    res.json({
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error exporting OSA report:', error);
    res.status(500).json({ message: 'Error exporting report', error: error.message });
  }
};

// Export Display report
export const exportDisplayReport = async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    let result;
    
    if (storeId && startDate && endDate) {
      result = await sql`
        SELECT 
          d.id,
          d.created_at,
          s.store_name,
          u.name as pc_name,
          d.display_type,
          d.cost,
          d.photo_url,
          d.verified
        FROM displays d
        LEFT JOIN stores s ON d.store_id = s.id
        LEFT JOIN users u ON d.pc_id = u.id
        WHERE d.store_id = ${storeId}
          AND d.created_at >= ${startDate}
          AND d.created_at <= ${endDate}
        ORDER BY d.created_at DESC
      `;
    } else if (startDate && endDate) {
      result = await sql`
        SELECT 
          d.id,
          d.created_at,
          s.store_name,
          u.name as pc_name,
          d.display_type,
          d.cost,
          d.photo_url,
          d.verified
        FROM displays d
        LEFT JOIN stores s ON d.store_id = s.id
        LEFT JOIN users u ON d.pc_id = u.id
        WHERE d.created_at >= ${startDate}
          AND d.created_at <= ${endDate}
        ORDER BY d.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT 
          d.id,
          d.created_at,
          s.store_name,
          u.name as pc_name,
          d.display_type,
          d.cost,
          d.photo_url,
          d.verified
        FROM displays d
        LEFT JOIN stores s ON d.store_id = s.id
        LEFT JOIN users u ON d.pc_id = u.id
        ORDER BY d.created_at DESC
        LIMIT 100
      `;
    }

    // Calculate total cost
    const totalCost = result.reduce((sum, row) => sum + parseFloat(row.cost || 0), 0);

    res.json({
      data: result,
      count: result.length,
      totalCost: totalCost,
    });
  } catch (error) {
    console.error('Error exporting display report:', error);
    res.status(500).json({ message: 'Error exporting report', error: error.message });
  }
};
