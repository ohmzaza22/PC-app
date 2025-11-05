/**
 * Role Authorization Middleware
 * Ensures users have the required role to access routes
 */

import { sql } from '../config/db.js';
import { sendForbidden } from '../utils/response.js';

/**
 * Require specific role(s) to access route
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const clerkId = req.userId; // Set by Clerk's requireAuth()

      if (!clerkId) {
        return sendForbidden(res, 'Authentication required');
      }

      // Get user from database
      const [user] = await sql`
        SELECT id, role FROM users WHERE clerk_id = ${clerkId}
      `;

      if (!user) {
        return sendForbidden(res, 'User not found');
      }

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return sendForbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      // Attach user info to request
      req.userRole = user.role;
      req.dbUserId = user.id;

      next();
    } catch (error) {
      console.error('❌ Role middleware error:', error);
      return sendForbidden(res, 'Authorization failed');
    }
  };
};

/**
 * Require PC role
 */
export const requirePC = requireRole(['PC']);

/**
 * Require MC/Supervisor role
 */
export const requireMC = requireRole(['SUPERVISOR', 'MC']);

/**
 * Require Admin role
 */
export const requireAdmin = requireRole(['ADMIN']);
