import express from 'express';
import { getDashboardSummary, exportOSAReport, exportDisplayReport } from '../controllers/adminController.js';
import { verifyClerkToken, requireRole } from '../middleware/clerkAuth.js';

const router = express.Router();

// All admin routes require authentication
router.use(verifyClerkToken);
router.use(requireRole('ADMIN', 'SUPERVISOR'));

// Dashboard summary
router.get('/dashboard', getDashboardSummary);

// Export reports
router.get('/reports/osa/export', exportOSAReport);
router.get('/reports/display/export', exportDisplayReport);

export default router;
