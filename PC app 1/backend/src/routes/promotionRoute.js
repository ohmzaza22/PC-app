import express from "express";
import { createPromotion, getPromotions, getPromotionById, deletePromotion } from "../controllers/promotionController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

router.post("/", requireRole("ADMIN", "SALES", "VENDOR"), upload.single("pdf"), createPromotion);
router.get("/", getPromotions);
router.get("/:id", getPromotionById);
router.delete("/:id", requireRole("ADMIN", "SALES"), deletePromotion);

export default router;
