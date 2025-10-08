import { sql } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Script to check all users and their roles
 */

async function checkUsers() {
  try {
    console.log("\n📋 Current Users in Database:\n");
    
    const users = await sql`
      SELECT id, name, email, role, clerk_id, created_at 
      FROM users 
      ORDER BY id ASC
    `;

    if (users.length === 0) {
      console.log("❌ No users found in database\n");
      process.exit(0);
    }

    console.table(users.map(u => ({
      ID: u.id,
      Name: u.name || 'N/A',
      Email: u.email,
      Role: u.role,
      'Clerk ID': u.clerk_id?.substring(0, 20) + '...',
      Created: new Date(u.created_at).toLocaleDateString()
    })));

    console.log(`\n✅ Total users: ${users.length}\n`);
    
    // Show role breakdown
    const roleCount = {};
    users.forEach(u => {
      roleCount[u.role] = (roleCount[u.role] || 0) + 1;
    });
    
    console.log("📊 Role Distribution:");
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

checkUsers();
