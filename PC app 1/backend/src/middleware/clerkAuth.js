import { clerkClient } from "@clerk/clerk-sdk-node";
import { sql } from "../config/db.js";

export async function verifyClerkToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify the session token with Clerk
    const sessionClaims = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach user info to request
    req.userId = sessionClaims.sub;
    req.clerkId = sessionClaims.sub;
    
    next();
  } catch (error) {
    console.error("Clerk auth error:", error);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      // Get user from database to check role
      const dbUser = await sql`
        SELECT id, role FROM users WHERE clerk_id = ${req.clerkId}
      `;

      if (dbUser.length === 0) {
        return res.status(404).json({ 
          message: "User not found in database. Please complete registration."
        });
      }

      const userRole = dbUser[0].role;
      req.userId = dbUser[0].id; // Set database user ID

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: "Forbidden - Insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: userRole || "none"
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
