import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import new routes
import userRoute from "./routes/userRoute.js";
import storeRoute from "./routes/storeRoute.js";
import storeVisitRoute from "./routes/storeVisitRoute.js";
import approvalRoute from "./routes/approvalRoute.js";
import osaRoute from "./routes/osaRoute.js";
import displayRoute from "./routes/displayRoute.js";
import surveyRoute from "./routes/surveyRoute.js";
import promotionRoute from "./routes/promotionRoute.js";
import adminRoute from "./routes/adminRoute.js";

import job from "./config/cron.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") job.start();

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
  credentials: true
}));
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (for local file storage)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const PORT = process.env.PORT || 5001;

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    app: "PC Field App API",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/users", userRoute);
app.use("/api/stores", storeRoute);
app.use("/api/store-visits", storeVisitRoute);
app.use("/api/approvals", approvalRoute);
app.use("/api/osa", osaRoute);
app.use("/api/displays", displayRoute);
app.use("/api/surveys", surveyRoute);
app.use("/api/promotions", promotionRoute);
app.use("/api/admin", adminRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PC Field App Server running on PORT: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Accessible at: http://localhost:${PORT} and http://172.20.10.2:${PORT}`);
  });
});
