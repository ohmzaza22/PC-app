import { clerkClient } from "@clerk/clerk-sdk-node";

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
      const user = await clerkClient.users.getUser(req.clerkId);
      const userRole = user.publicMetadata?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: "Forbidden - Insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: userRole || "none"
        });
      }

      req.userRole = userRole;
      req.user = user;
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
