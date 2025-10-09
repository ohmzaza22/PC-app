import express from "express";
import { createStore, getStores, getStoreById, updateStore, deleteStore } from "../controllers/storeController.js";
import { verifyClerkToken, requireRole } from "../middleware/clerkAuth.js";

const router = express.Router();

// All routes require authentication
router.use(verifyClerkToken);

router.post("/", requireRole("ADMIN", "SUPERVISOR"), createStore);
router.get("/", getStores);
router.get("/:id", getStoreById);
router.patch("/:id", requireRole("ADMIN", "SUPERVISOR"), updateStore);
router.delete("/:id", requireRole("ADMIN"), deleteStore);

export default router;
