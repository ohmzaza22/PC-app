import express from "express";
import { 
  checkIn, 
  checkOut, 
  getCurrentVisit, 
  getVisitHistory,
  validateTaskAccess 
} from "../controllers/storeVisitController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

// PC routes
router.post("/check-in", requireRole("PC"), checkIn);
router.post("/check-out", requireRole("PC"), checkOut);
router.get("/current", requireRole("PC"), getCurrentVisit);
router.get("/validate-access", requireRole("PC"), validateTaskAccess);

// History routes (accessible by PC, SUPERVISOR, ADMIN)
router.get("/history", requireRole("PC", "SUPERVISOR", "ADMIN"), getVisitHistory);

export default router;
