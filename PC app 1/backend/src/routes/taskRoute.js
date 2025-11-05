/**
 * Task Routes
 * Routes for task management
 */

import express from 'express';
import { verifyClerkToken } from '../middleware/clerkAuth.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { 
  getCheckinEligibility, 
  getPCDashboard, 
  updateTaskStatus, 
  getTaskDetails 
} from '../controllers/taskController.js';
import { 
  createTaskBatch, 
  getMyBatches, 
  getBatchDetails 
} from '../controllers/taskBatchController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

// ==========================================
// PC Routes - Task viewing and status updates
// ==========================================

/**
 * @route GET /api/pc/checkin-eligibility
 * @desc Get stores with tasks eligible for check-in today
 * @access Private (PC only)
 */
router.get('/pc/checkin-eligibility', getCheckinEligibility);

/**
 * @route GET /api/pc/dashboard
 * @desc Get PC dashboard with tasks grouped by status
 * @access Private (PC only)
 */
router.get('/pc/dashboard', getPCDashboard);

/**
 * @route GET /api/tasks/:id
 * @desc Get task details
 * @access Private
 */
router.get('/tasks/:id', getTaskDetails);

/**
 * @route PATCH /api/tasks/:id/status
 * @desc Update task status (PC: IN_PROGRESS/SUBMITTED/COMPLETED, MC: APPROVED/REJECTED)
 * @access Private
 */
router.patch('/tasks/:id/status', updateTaskStatus);

// ==========================================
// Supervisor Routes - Task batch creation and management
// ==========================================

/**
 * @route POST /api/task-batches
 * @desc Create a new task batch with multiple tasks
 * @access Private (SUPERVISOR, MC, ADMIN)
 */
router.post('/task-batches', requireRole(['SUPERVISOR', 'MC', 'ADMIN']), createTaskBatch);

/**
 * @route GET /api/task-batches
 * @desc Get all batches created by the current supervisor
 * @access Private (SUPERVISOR, MC, ADMIN)
 */
router.get('/task-batches', requireRole(['SUPERVISOR', 'MC', 'ADMIN']), getMyBatches);

/**
 * @route GET /api/task-batches/:id
 * @desc Get batch details with all tasks
 * @access Private (SUPERVISOR, MC, ADMIN)
 */
router.get('/task-batches/:id', requireRole(['SUPERVISOR', 'MC', 'ADMIN']), getBatchDetails);

export default router;
