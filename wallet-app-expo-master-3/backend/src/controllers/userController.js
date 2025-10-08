import { sql } from "../config/db.js";

export async function createOrUpdateUser(req, res) {
  try {
    const { name, email, role, clerk_id } = req.body;

    if (!clerk_id) {
      return res.status(400).json({ message: "Clerk ID is required" });
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerk_id}
    `;

    let user;
    if (existingUser.length > 0) {
      // Update existing user
      user = await sql`
        UPDATE users
        SET name = COALESCE(${name}, name),
            email = COALESCE(${email}, email),
            role = COALESCE(${role}, role)
        WHERE clerk_id = ${clerk_id}
        RETURNING *
      `;
    } else {
      // Create new user
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

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

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
