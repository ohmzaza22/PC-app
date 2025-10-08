import express from "express";
import {
  getPendingApprovals,
  approveOSA,
  rejectOSA,
  approveDisplay,
  rejectDisplay,
  approveSurvey,
  rejectSurvey,
  getRejectedTasks,
  getApprovalStats,
} from "../controllers/approvalController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

// Get pending approvals (Supervisor/Admin only)
router.get("/pending", requireRole("SUPERVISOR", "ADMIN"), getPendingApprovals);

// OSA approval routes
router.post("/osa/:id/approve", requireRole("SUPERVISOR", "ADMIN"), approveOSA);
router.post("/osa/:id/reject", requireRole("SUPERVISOR", "ADMIN"), rejectOSA);

// Display approval routes
router.post("/display/:id/approve", requireRole("SUPERVISOR", "ADMIN"), approveDisplay);
router.post("/display/:id/reject", requireRole("SUPERVISOR", "ADMIN"), rejectDisplay);

// Survey approval routes
router.post("/survey/:id/approve", requireRole("SUPERVISOR", "ADMIN"), approveSurvey);
router.post("/survey/:id/reject", requireRole("SUPERVISOR", "ADMIN"), rejectSurvey);

// Get rejected tasks (PC can see their own)
router.get("/rejected", requireRole("PC"), getRejectedTasks);

// Get approval statistics
router.get("/stats", requireRole("PC", "SUPERVISOR", "ADMIN"), getApprovalStats);

export default router;
