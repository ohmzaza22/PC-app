import express from "express";
import { createOSARecord, getOSARecords, getOSARecordById, deleteOSARecord } from "../controllers/osaController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

router.post("/", upload.single("photo"), createOSARecord);
router.get("/", getOSARecords);
router.get("/:id", getOSARecordById);
router.delete("/:id", requireRole("PC", "SUPERVISOR", "ADMIN"), deleteOSARecord);

export default router;
