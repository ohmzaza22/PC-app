import { sql } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script to update user role in the database
 * Usage: node src/scripts/update-user-role.js <email> <role>
 * Example: node src/scripts/update-user-role.js user@example.com SUPERVISOR
 */

async function updateUserRole() {
  try {
    const email = process.argv[2];
    const newRole = process.argv[3];

    if (!email || !newRole) {
      console.log("\n❌ Usage: node src/scripts/update-user-role.js <email> <role>");
      console.log("\nAvailable roles:");
      console.log("  - PC (Field Staff)");
      console.log("  - SUPERVISOR (MC/Supervisor)");
      console.log("  - ADMIN (Administrator)");
      console.log("  - SALES (Sales Team)");
      console.log("  - VENDOR (Vendor)");
      console.log("\nExample:");
      console.log("  node src/scripts/update-user-role.js user@example.com SUPERVISOR\n");
      process.exit(1);
    }

    const validRoles = ['PC', 'SUPERVISOR', 'ADMIN', 'SALES', 'VENDOR'];
    const roleUpper = newRole.toUpperCase();

    if (!validRoles.includes(roleUpper)) {
      console.log(`\n❌ Invalid role: ${newRole}`);
      console.log(`Valid roles: ${validRoles.join(', ')}\n`);
      process.exit(1);
    }

    console.log(`\n🔄 Updating user role...`);
    console.log(`Email: ${email}`);
    console.log(`New Role: ${roleUpper}`);

    // Check if user exists
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (existingUser.length === 0) {
      console.log(`\n❌ User not found with email: ${email}`);
      console.log(`\nAvailable users:`);
      
      const allUsers = await sql`SELECT id, name, email, role FROM users ORDER BY id`;
      allUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.name}) - Current role: ${user.role}`);
      });
      
      process.exit(1);
    }

    // Update user role
    const updatedUser = await sql`
      UPDATE users
      SET role = ${roleUpper}
      WHERE email = ${email}
      RETURNING *
    `;

    console.log(`\n✅ User role updated successfully!`);
    console.log(`\nUser Details:`);
    console.log(`  ID: ${updatedUser[0].id}`);
    console.log(`  Name: ${updatedUser[0].name}`);
    console.log(`  Email: ${updatedUser[0].email}`);
    console.log(`  Role: ${updatedUser[0].role}`);
    console.log(`  Clerk ID: ${updatedUser[0].clerk_id}`);
    console.log(`\n✨ Done! Please restart your mobile app to see the changes.\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error updating user role:", error);
    process.exit(1);
  }
}

// Run the script
updateUserRole();
