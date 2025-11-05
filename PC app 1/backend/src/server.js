/**
 * =============================================================================
 * PC FIELD APP - BACKEND SERVER
 * =============================================================================
 * 
 * ระบบ Backend API สำหรับจัดการงานภาคสนาม (Field Operations)
 * สร้างด้วย Node.js + Express.js + PostgreSQL (NeonDB)
 * 
 * Features:
 * - RESTful API endpoints
 * - JWT Authentication (Clerk)
 * - Rate Limiting (Upstash Redis)
 * - File Upload (Cloudinary)
 * - Scheduled Jobs (Cron)
 * 
 * @author PC Field Team
 * @version 1.0.0
 */

// =============================================================================
// IMPORTS
// =============================================================================

// Core Dependencies
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Configuration
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

// ES Modules: สร้าง __dirname และ __filename สำหรับ ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// ROUTE IMPORTS
// =============================================================================

// User & Store Management
import userRoute from "./routes/userRoute.js";           // จัดการข้อมูลผู้ใช้
import storeRoute from "./routes/storeRoute.js";         // จัดการข้อมูลร้านค้า
import storeVisitRoute from "./routes/storeVisitRoute.js"; // Check-in/Check-out

// Task Management
import taskRoute from "./routes/taskRoute.js";           // จัดการงาน (PC & MC)

// Field Operations
import osaRoute from "./routes/osaRoute.js";             // OSA (On-Shelf Availability)
import displayRoute from "./routes/displayRoute.js";     // Special Display
import surveyRoute from "./routes/surveyRoute.js";       // Survey
import promotionRoute from "./routes/promotionRoute.js"; // Promotions

// Approval & Admin
import approvalRoute from "./routes/approvalRoute.js";   // อนุมัติงาน
import adminRoute from "./routes/adminRoute.js";         // Admin functions

// =============================================================================
// SCHEDULED JOBS
// =============================================================================

import job from "./config/cron.js";  // Cron jobs สำหรับงานตามเวลา

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

// โหลด environment variables จากไฟล์ .env
dotenv.config();

// =============================================================================
// APPLICATION SETUP
// =============================================================================

const app = express();

// =============================================================================
// CRON JOBS (Production Only)
// =============================================================================

/**
 * เริ่มต้น scheduled jobs เฉพาะใน production environment
 * - ทำความสะอาดข้อมูลเก่า
 * - ส่ง reminders
 * - สร้างรายงานอัตโนมัติ
 */
if (process.env.NODE_ENV === "production") {
  job.start();
}

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * CORS Configuration
 * อนุญาตให้ Mobile app เข้าถึง API จากหลาย ports (Expo development)
 * - 8081: Default Expo port
 * - 8082, 8083: Alternative ports
 */
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
  credentials: true  // อนุญาตให้ส่ง cookies/credentials
}));

/**
 * Rate Limiting Middleware (Upstash Redis)
 * จำกัดจำนวน requests เพื่อป้องกัน abuse
 * - 100 requests per 15 minutes per IP
 */
app.use(rateLimiter);

/**
 * Body Parsing Middleware
 * แปลง request body เป็น JSON และ URL-encoded
 */
app.use(express.json());                         // รองรับ JSON payloads
app.use(express.urlencoded({ extended: true })); // รองรับ form data

/**
 * Static File Serving
 * Serve uploaded files สำหรับ local development
 * (Production ใช้ Cloudinary)
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

const PORT = process.env.PORT || 5001;

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

/**
 * Health Check Endpoint
 * ใช้ตรวจสอบว่า server ทำงานปกติ
 * 
 * @route GET /api/health
 * @access Public
 * @returns {Object} { status, app, timestamp }
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    app: "PC Field App API",
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * User Management Routes
 * - สร้าง/อัพเดทผู้ใช้
 * - ดึงข้อมูลผู้ใช้
 * - อัพเดทบทบาท
 */
app.use("/api/users", userRoute);

/**
 * Store Management Routes
 * - จัดการข้อมูลร้านค้า
 * - มอบหมายร้านให้ PC
 */
app.use("/api/stores", storeRoute);

/**
 * Store Visit Routes (Check-in System)
 * - เช็คอิน/เช็คเอาท์
 * - ประวัติการเข้าร้าน
 */
app.use("/api/store-visits", storeVisitRoute);

/**
 * Approval Routes
 * - อนุมัติงาน OSA, Display, Survey
 * - ดูงานที่รออนุมัติ/ถูกปฏิเสธ
 */
app.use("/api/approvals", approvalRoute);

/**
 * OSA Routes (On-Shelf Availability)
 * - บันทึกสถานะสินค้าบนชั้น
 */
app.use("/api/osa", osaRoute);

/**
 * Display Routes
 * - บันทึก Special Display
 */
app.use("/api/displays", displayRoute);

/**
 * Survey Routes
 * - บันทึกแบบสำรวจ
 */
app.use("/api/surveys", surveyRoute);

/**
 * Promotion Routes
 * - จัดการโปรโมชั่น
 */
app.use("/api/promotions", promotionRoute);

/**
 * Admin Routes
 * - รายงาน Dashboard
 * - จัดการผู้ใช้และร้าน
 */
app.use("/api/admin", adminRoute);

/**
 * Task Management Routes
 * รวม endpoints:
 * - /api/pc/* (PC endpoints)
 * - /api/task-batches (MC endpoints)
 * - /api/tasks/* (Task operations)
 */
app.use("/api", taskRoute);

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Global Error Handler
 * จัดการ errors ทั้งหมดที่เกิดขึ้นใน application
 * 
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {}  // แสดง stack trace ใน dev only
  });
});

/**
 * 404 Not Found Handler
 * จัดการ requests ที่ไม่ตรงกับ route ใดๆ
 */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// =============================================================================
// DATABASE INITIALIZATION & SERVER START
// =============================================================================

/**
 * เริ่มต้น Database และ Server
 * 
 * Flow:
 * 1. รัน database migrations
 * 2. เชื่อมต่อ database
 * 3. เริ่มต้น Express server
 */
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PC Field App Server running on PORT: ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Accessible at: http://localhost:${PORT} and http://172.20.10.2:${PORT}`);
  });
});
