import express from "express";
import { createDisplay, getDisplays, verifyDisplay, deleteDisplay } from "../controllers/displayController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

router.post("/", upload.single("photo"), createDisplay);
router.get("/", getDisplays);
router.patch("/:id/verify", requireRole("SUPERVISOR", "ADMIN"), verifyDisplay);
router.delete("/:id", requireRole("PC", "SUPERVISOR", "ADMIN"), deleteDisplay);

export default router;
