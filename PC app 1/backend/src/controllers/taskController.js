/**
 * Task Controller
 * Handles task management for PC users
 */

import { sql } from '../config/db.js';
import { sendSuccess, sendError, sendValidationError, sendNotFound, sendForbidden } from '../utils/response.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { getUserIdFromClerkId } from '../utils/helpers.js';
import { TASK_STATUS, PC_ALLOWED_STATUS, MC_ALLOWED_STATUS } from '../constants/index.js';

/**
 * Get check-in eligible stores for PC user (stores with tasks for today)
 * @route GET /api/pc/checkin-eligibility
 * @access Private (PC only)
 */
export async function getCheckinEligibility(req, res) {
  try {
    const pcUserId = await getUserIdFromClerkId(sql, req.userId);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD format

    // Get all tasks for this PC user that are eligible today
    const eligibleTasks = await sql`
      SELECT 
        t.*,
        s.store_name,
        s.location,
        tb.note as batch_note,
        u.name as assigned_by_name,
        u.email as assigned_by_email
      FROM tasks t
      LEFT JOIN task_batches tb ON t.batch_id = tb.id
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users u ON t.assigned_by_mc_id = u.id
      WHERE t.assigned_to_pc_id = ${pcUserId}
        AND t.status NOT IN ('APPROVED', 'REJECTED', 'CANCELLED')
        AND (
          t.task_date = ${today}::date
          OR (
            t.active_from IS NOT NULL 
            AND t.active_to IS NOT NULL 
            AND NOW() AT TIME ZONE 'Asia/Bangkok' BETWEEN t.active_from AND t.active_to
          )
        )
      ORDER BY t.task_date ASC, t.created_at ASC
    `;

    // Group tasks by store
    const storeMap = new Map();
    for (const task of eligibleTasks) {
      if (!storeMap.has(task.store_id)) {
        storeMap.set(task.store_id, {
          storeId: task.store_id,
          storeName: task.store_name,
          location: task.location,
          tasks: [],
          assignedByName: task.assigned_by_name,
          assignedByEmail: task.assigned_by_email,
        });
      }
      storeMap.get(task.store_id).tasks.push({
        id: task.id,
        type: task.type,
        title: task.title,
        description: task.description,
        status: task.status,
        taskDate: task.task_date,
        activeFrom: task.active_from,
        activeTo: task.active_to,
        dueDate: task.due_date,
        attachments: task.attachments,
        batchNote: task.batch_note,
        assignedBy: task.assigned_by_name,
      });
    }

    const eligibleStores = Array.from(storeMap.values());

    sendSuccess(res, {
      date: today,
      eligibleStores,
      totalStores: eligibleStores.length,
      totalTasks: eligibleTasks.length,
    });
  } catch (error) {
    console.error('❌ Error fetching checkin eligibility:', error);
    sendError(res, error.message);
  }
}

/**
 * Get PC dashboard with task summary
 * @route GET /api/pc/dashboard
 * @access Private (PC only)
 */
export async function getPCDashboard(req, res) {
  try {
    const pcUserId = await getUserIdFromClerkId(sql, req.userId);

    // Get all tasks grouped by status
    const tasks = await sql`
      SELECT 
        t.*,
        s.store_name,
        u.name as assigned_by_name
      FROM tasks t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users u ON t.assigned_by_mc_id = u.id
      WHERE t.assigned_to_pc_id = ${pcUserId}
      ORDER BY 
        CASE t.status
          WHEN 'PENDING' THEN 1
          WHEN 'IN_PROGRESS' THEN 2
          WHEN 'SUBMITTED' THEN 3
          WHEN 'APPROVED' THEN 4
          WHEN 'REJECTED' THEN 5
          WHEN 'CANCELLED' THEN 6
        END,
        t.task_date ASC,
        t.created_at DESC
    `;

    // Group by status
    const tasksByStatus = {
      PENDING: [],
      IN_PROGRESS: [],
      SUBMITTED: [],
      APPROVED: [],
      REJECTED: [],
      CANCELLED: [],
    };

    for (const task of tasks) {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push({
          id: task.id,
          type: task.type,
          title: task.title,
          description: task.description,
          storeName: task.store_name,
          storeId: task.store_id,
          status: task.status,
          taskDate: task.task_date,
          dueDate: task.due_date,
          assignedBy: task.assigned_by_name,
          createdAt: task.created_at,
        });
      }
    }

    // Summary stats
    const stats = {
      total: tasks.length,
      pending: tasksByStatus.PENDING.length,
      inProgress: tasksByStatus.IN_PROGRESS.length,
      submitted: tasksByStatus.SUBMITTED.length,
      approved: tasksByStatus.APPROVED.length,
      rejected: tasksByStatus.REJECTED.length,
      cancelled: tasksByStatus.CANCELLED.length,
    };

    sendSuccess(res, { tasksByStatus, stats });
  } catch (error) {
    console.error('❌ Error fetching PC dashboard:', error);
    sendError(res, error.message);
  }
}

/**
 * Update task status
 * @route PATCH /api/tasks/:id/status
 * @access Private (PC can set IN_PROGRESS/SUBMITTED/COMPLETED, MC can set APPROVED/REJECTED)
 */
export async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = await getUserIdFromClerkId(sql, req.userId);

    if (!status) {
      return sendValidationError(res, 'Status is required');
    }

    // Get task with user info
    const [task] = await sql`
      SELECT t.*, u.role
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_pc_id = u.id
      WHERE t.id = ${id}
    `;

    if (!task) {
      return sendNotFound(res, 'Task not found');
    }

    // Get current user's role
    const [currentUser] = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `;

    // Validate status change based on role
    if (currentUser.role === 'PC') {
      if (!PC_ALLOWED_STATUS.includes(status)) {
        return sendForbidden(res, `PC users can only set status to: ${PC_ALLOWED_STATUS.join(', ')}`);
      }
      if (task.assigned_to_pc_id !== userId) {
        return sendForbidden(res, 'You can only update your own tasks');
      }
    } else if (currentUser.role === 'SUPERVISOR' || currentUser.role === 'MC') {
      if (!MC_ALLOWED_STATUS.includes(status)) {
        return sendForbidden(res, `MC users can only set status to: ${MC_ALLOWED_STATUS.join(', ')}`);
      }
    } else {
      return sendForbidden(res, 'Invalid role for task status updates');
    }

    // Update task status
    const [updatedTask] = await sql`
      UPDATE tasks
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    sendSuccess(res, { task: updatedTask }, 'Task status updated successfully');
  } catch (error) {
    console.error('❌ Error updating task status:', error);
    sendError(res, error.message);
  }
}

/**
 * Get task details
 * @route GET /api/tasks/:id
 * @access Private
 */
export async function getTaskDetails(req, res) {
  try {
    const { id } = req.params;
    const userId = await getUserIdFromClerkId(sql, req.userId);

    const [task] = await sql`
      SELECT 
        t.*,
        s.store_name,
        s.location,
        mc.first_name || ' ' || mc.last_name as assigned_by_name,
        pc.first_name || ' ' || pc.last_name as assigned_to_name,
        tb.note as batch_note
      FROM tasks t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users mc ON t.assigned_by_mc_id = mc.id
      LEFT JOIN users pc ON t.assigned_to_pc_id = pc.id
      LEFT JOIN task_batches tb ON t.batch_id = tb.id
      WHERE t.id = ${id}
    `;

    if (!task) {
      return sendNotFound(res, 'Task not found');
    }

    // Check permission
    const [currentUser] = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `;

    if (currentUser.role === 'PC' && task.assigned_to_pc_id !== userId) {
      return sendForbidden(res, 'You can only view your own tasks');
    }

    sendSuccess(res, { task });
  } catch (error) {
    console.error('❌ Error fetching task details:', error);
    sendError(res, error.message);
  }
}
