/**
 * Task Batch Controller
 * Handles task batch creation and management by Supervisor users
 */

import { sql } from '../config/db.js';
import { sendSuccess, sendCreated, sendError, sendValidationError, sendNotFound, sendForbidden } from '../utils/response.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { getUserIdFromClerkId } from '../utils/helpers.js';
import { VALID_TASK_TYPES, TASK_STATUS } from '../constants/index.js';

/**
 * Create a task batch with multiple tasks
 * @route POST /api/task-batches
 * @access Private (Supervisor only)
 */
export async function createTaskBatch(req, res) {
  try {
    const { assignedToPcId, storeId, note, tasks } = req.body;
    const supervisorUserId = await getUserIdFromClerkId(sql, req.userId);

    // Validate required fields
    if (!assignedToPcId || !storeId || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return sendValidationError(res, 'assignedToPcId, storeId, and tasks array are required');
    }

    // Verify PC user exists and has PC role
    const [pcUser] = await sql`
      SELECT id, role FROM users WHERE id = ${assignedToPcId}
    `;
    if (!pcUser) {
      return sendNotFound(res, 'PC user not found');
    }
    if (pcUser.role !== 'PC') {
      return sendValidationError(res, 'Assigned user must have PC role');
    }

    // Validate task types
    const invalidTasks = tasks.filter(task => !VALID_TASK_TYPES.includes(task.type));
    if (invalidTasks.length > 0) {
      return sendValidationError(res, `Invalid task types: ${invalidTasks.map(t => t.type).join(', ')}. Allowed: ${VALID_TASK_TYPES.join(', ')}`);
    }

    // Validate task fields
    for (const task of tasks) {
      if (!task.type || !task.title) {
        return sendValidationError(res, 'Each task must have type and title');
      }
      if (!task.taskDate && (!task.active_from || !task.active_to)) {
        return sendValidationError(res, 'Each task must have either taskDate or active_from/active_to window');
      }
    }

    // Manually handle transaction since sql.begin is not supported
    await sql.unsafe('BEGIN');
    let result;
    try {
      // Create batch
      const [batch] = await sql`
        INSERT INTO task_batches (
          assigned_by_mc_id,
          assigned_to_pc_id,
          store_id,
          batch_name,
          note,
          priority,
          status
        ) VALUES (
          ${supervisorUserId},
          ${assignedToPcId},
          ${storeId},
          ${'Task Batch ' + new Date().toLocaleDateString()},
          ${note || null},
          'MEDIUM',
          'ACTIVE'
        )
        RETURNING *
      `;

      // Create tasks
      const createdTasks = [];
      for (const task of tasks) {
        const [createdTask] = await sql`
          INSERT INTO tasks (
            batch_id,
            type,
            title,
            description,
            store_id,
            task_date,
            due_date,
            priority,
            attachments,
            assigned_by_mc_id,
            assigned_to_pc_id,
            status
          ) VALUES (
            ${batch.id},
            ${task.type},
            ${task.title},
            ${task.description || null},
            ${storeId},
            ${task.taskDate},
            ${task.dueDate || null},
            ${task.priority || 'MEDIUM'},
            ${JSON.stringify(task.attachments || [])},
            ${supervisorUserId},
            ${assignedToPcId},
            'PENDING'
          )
          RETURNING *
        `;
        createdTasks.push(createdTask);
      }

      await sql.unsafe('COMMIT');
      result = { batch, tasks: createdTasks };

    } catch (transactionError) {
      await sql.unsafe('ROLLBACK');
      console.error('❌ Transaction rolled back due to error:', transactionError);
      throw transactionError; // Re-throw to be caught by the outer try-catch
    }

    sendCreated(res, result, 'Task batch created successfully');
  } catch (error) {
    console.error('❌ Error creating task batch:', error);
    sendError(res, error.message);
  }
}

/**
 * Get all batches created by Supervisor
 * @route GET /api/task-batches
 * @access Private (Supervisor only)
 */
export async function getMyBatches(req, res) {
  try {
    const supervisorUserId = await getUserIdFromClerkId(sql, req.userId);

    const batches = await sql`
      SELECT 
        tb.*,
        u.name as pc_name,
        u.email as pc_email,
        COUNT(t.id) as task_count
      FROM task_batches tb
      LEFT JOIN users u ON tb.assigned_to_pc_id = u.id
      LEFT JOIN tasks t ON tb.id = t.batch_id
      WHERE tb.assigned_by_mc_id = ${supervisorUserId}
      GROUP BY tb.id, u.name, u.email
      ORDER BY tb.created_at DESC
    `;

    sendSuccess(res, { batches });
  } catch (error) {
    console.error('❌ Error fetching batches:', error);
    sendError(res, error.message);
  }
}

/**
 * Get batch details with tasks
 * @route GET /api/task-batches/:id
 * @access Private (Supervisor only)
 */
export async function getBatchDetails(req, res) {
  try {
    const { id } = req.params;
    const supervisorUserId = await getUserIdFromClerkId(sql, req.userId);

    const [batch] = await sql`
      SELECT 
        tb.*,
        u.name as pc_name,
        u.email as pc_email
      FROM task_batches tb
      LEFT JOIN users u ON tb.assigned_to_pc_id = u.id
      WHERE tb.id = ${id} AND tb.assigned_by_mc_id = ${supervisorUserId}
    `;

    if (!batch) {
      return sendNotFound(res, 'Batch not found');
    }

    const tasks = await sql`
      SELECT * FROM tasks
      WHERE batch_id = ${id}
      ORDER BY created_at ASC
    `;

    sendSuccess(res, { batch, tasks });
  } catch (error) {
    console.error('❌ Error fetching batch details:', error);
    sendError(res, error.message);
  }
}
