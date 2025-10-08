import express from "express";
import { createSurvey, getSurveys, getSurveyById, deleteSurvey } from "../controllers/surveyController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

router.post("/", upload.single("photo"), createSurvey);
router.get("/", getSurveys);
router.get("/:id", getSurveyById);
router.delete("/:id", requireRole("PC", "SUPERVISOR", "ADMIN"), deleteSurvey);

export default router;
