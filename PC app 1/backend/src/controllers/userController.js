/**
 * =============================================================================
 * USER CONTROLLER
 * =============================================================================
 * 
 * จัดการข้อมูลผู้ใช้ในระบบ (Users Management)
 * 
 * Functions:
 * - createOrUpdateUser - สร้างหรืออัพเดทผู้ใช้
 * - getUserByClerkId - ดึงข้อมูลผู้ใช้จาก Clerk ID
 * - getAllUsers - ดึงรายชื่อผู้ใช้ทั้งหมด (filter by role)
 * - updateUserRole - อัพเดทบทบาทผู้ใช้
 * - deleteUser - ลบผู้ใช้
 * 
 * @module controllers/userController
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { sql } from "../config/db.js";

// =============================================================================

/**
 * สร้างหรืออัพเดทข้อมูลผู้ใช้
 * 
 * ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่ (ตาม clerk_id):
 * - ถ้ามี: อัพเดทข้อมูล
 * - ถ้าไม่มี: สร้างใหม่
 * 
 * @route POST /api/users
 * @access Private
 * 
 * @param {Request} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - ชื่อผู้ใช้
 * @param {string} req.body.email - Email
 * @param {string} req.body.role - บทบาท (PC/MC/Admin)
 * @param {string} req.body.clerk_id - Clerk User ID
 * @param {Response} res - Express response
 * @returns {Object} User object
 */
export async function createOrUpdateUser(req, res) {
  try {
    const { name, email, role, clerk_id } = req.body;

    // Validation: ต้องมี clerk_id
    if (!clerk_id) {
      return res.status(400).json({ message: "Clerk ID is required" });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerk_id}
    `;

    let user;
    if (existingUser.length > 0) {
      // ผู้ใช้มีอยู่แล้ว -> อัพเดทข้อมูล
      // ใช้ COALESCE เพื่อเก็บค่าเดิมถ้าไม่มีค่าใหม่
      user = await sql`
        UPDATE users
        SET name = COALESCE(${name}, name),
            email = COALESCE(${email}, email),
            role = COALESCE(${role}, role)
        WHERE clerk_id = ${clerk_id}
        RETURNING *
      `;
    } else {
      // ผู้ใช้ใหม่ -> สร้างข้อมูล
      // Default role = 'PC' ถ้าไม่ระบุ
      user = await sql`
        INSERT INTO users(name, email, role, clerk_id)
        VALUES (${name}, ${email}, ${role || 'PC'}, ${clerk_id})
        RETURNING *
      `;
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ดึงข้อมูลผู้ใช้จาก Clerk ID
 * 
 * @route GET /api/users/clerk/:clerk_id
 * @access Private
 * 
 * @param {Request} req - Express request
 * @param {string} req.params.clerk_id - Clerk User ID
 * @param {Response} res - Express response
 * @returns {Object} User object
 */
export async function getUserByClerkId(req, res) {
  try {
    const { clerk_id } = req.params;

    const user = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerk_id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด
 * 
 * สามารถ filter ตาม role ได้
 * ถ้า role = 'PC' จะรวมข้อมูลร้านที่ assigned ด้วย
 * 
 * @route GET /api/users?role=PC
 * @access Private
 * 
 * @param {Request} req - Express request
 * @param {string} req.query.role - Filter by role (PC/MC/Admin)
 * @param {Response} res - Express response
 * @returns {Array} Array of users
 */
export async function getAllUsers(req, res) {
  try {
    const { role } = req.query;
    
    let users;
    if (role) {
      users = await sql`
        SELECT * FROM users WHERE role = ${role} ORDER BY name ASC
      `;
    } else {
      users = await sql`
        SELECT * FROM users ORDER BY name ASC
      `;
    }

    // กรณี PC users: ดึงข้อมูลร้านที่ assigned ด้วย
    if (role === 'PC') {
      // ใช้ Promise.all เพื่อ query stores แบบ parallel
      const usersWithStores = await Promise.all(
        users.map(async (user) => {
          // ดึงร้านที่ assigned ให้ PC คนนี้
          const stores = await sql`
            SELECT id, store_name, store_code, store_type, location
            FROM stores
            WHERE assigned_pc_id = ${user.id}
            ORDER BY store_name ASC
          `;
          return {
            ...user,
            assigned_stores: stores
          };
        })
      );
      return res.status(200).json(usersWithStores);
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * อัพเดทบทบาทผู้ใช้
 * 
 * @route PATCH /api/users/:id/role
 * @access Private (Admin/MC)
 * 
 * @param {Request} req - Express request
 * @param {string} req.params.id - User ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.role - New role (PC/MC/Admin)
 * @param {Response} res - Express response
 * @returns {Object} Updated user object
 */
export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const user = await sql`
      UPDATE users
      SET role = ${role}
      WHERE id = ${id}
      RETURNING *
    `;

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ลบผู้ใช้
 * 
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 * 
 * @param {Request} req - Express request
 * @param {string} req.params.id - User ID
 * @param {Response} res - Express response
 * @returns {Object} Success message
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM users WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
