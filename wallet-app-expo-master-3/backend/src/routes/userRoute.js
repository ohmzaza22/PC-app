import express from "express";
import { createOrUpdateUser, getUserByClerkId, getAllUsers, updateUserRole, deleteUser } from "../controllers/userController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";

const router = express.Router();

// Public route for user creation/sync
router.post("/", createOrUpdateUser);

// Protected routes
router.use(verifyClerkToken);

router.get("/clerk/:clerk_id", getUserByClerkId);
router.get("/", requireRole("ADMIN", "SUPERVISOR"), getAllUsers);
router.patch("/:id/role", requireRole("ADMIN"), updateUserRole);
router.delete("/:id", requireRole("ADMIN"), deleteUser);

export default router;
