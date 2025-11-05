/**
 * =============================================================================
 * CLERK AUTHENTICATION MIDDLEWARE
 * =============================================================================
 * 
 * จัดการ Authentication และ Authorization ด้วย Clerk
 * 
 * Functions:
 * - verifyClerkToken - ตรวจสอบ JWT token จาก Clerk
 * - requireRole - ตรวจสอบสิทธิ์ตามบทบาท (Role-Based Access Control)
 * 
 * @module middleware/clerkAuth
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { clerkClient } from "@clerk/clerk-sdk-node";
import { sql } from "../config/db.js";

// =============================================================================

/**
 * ตรวจสอบ JWT Token จาก Clerk
 * 
 * Flow:
 * 1. ดึง Authorization header
 * 2. แยก Bearer token
 * 3. Verify token กับ Clerk
 * 4. Extract user info (sub = user_id)
 * 5. Attach ไปที่ req.userId และ req.clerkId
 * 
 * @middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 * @returns {void}
 */
export async function verifyClerkToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    // ตรวจสอบ token กับ Clerk
    // Clerk จะ verify signature และ expiration
    const sessionClaims = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach user info to request object
    // sub = Clerk User ID
    req.userId = sessionClaims.sub;
    req.clerkId = sessionClaims.sub;
    
    next();
  } catch (error) {
    console.error("Clerk auth error:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}

/**
 * Role-Based Access Control Middleware
 * 
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าถึง endpoint หรือไม่
 * 
 * Flow:
 * 1. ดึงข้อมูลผู้ใช้จาก database (ด้วย clerkId)
 * 2. ตรวจสอบบทบาท (role)
 * 3. ถ้าบทบาทตรงกับที่อนุญาต -> next()
 * 4. ถ้าไม่ตรง -> 403 Forbidden
 * 
 * @function requireRole
 * @param {...string} allowedRoles - บทบาทที่อนุญาต (PC, MC, Admin)
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/admin', verifyClerkToken, requireRole('Admin'), adminController);
 * router.post('/tasks', verifyClerkToken, requireRole('MC', 'Admin'), createTask);
 */
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      // ดึงข้อมูลผู้ใช้จาก database เพื่อตรวจสอบบทบาท
      const dbUser = await sql`
        SELECT id, role FROM users WHERE clerk_id = ${req.clerkId}
      `;

      if (dbUser.length === 0) {
        return res.status(404).json({ 
          message: "User not found in database. Please complete registration."
        });
      }

      const userRole = dbUser[0].role;
      req.userId = dbUser[0].id; // Overwrite ด้วย database user ID (ใช้แทน Clerk ID)

      // ตรวจสอบว่า role ของผู้ใช้อยู่ใน allowedRoles หรือไม่
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: "Forbidden - Insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: userRole || "none"
        });
      }

      // Attach userRole to request object สำหรับใช้ใน controllers
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
