# How to Change User Role to MC (Supervisor)

## 🎯 Quick Guide

### **Method 1: Using the Script (Recommended)**

1. **Open Terminal** and navigate to backend folder:
```bash
cd /Users/taponwat.p/Documents/GitHub/PC-app/wallet-app-expo-master-3/backend
```

2. **Run the update script** with your email:
```bash
node src/scripts/update-user-role.js YOUR_EMAIL@example.com SUPERVISOR
```

**Example:**
```bash
node src/scripts/update-user-role.js john@example.com SUPERVISOR
```

3. **Restart your mobile app** to see the changes

---

### **Method 2: Direct Database Update**

If you know your user ID or email, you can update directly:

```bash
cd backend
node
```

Then in Node console:
```javascript
import { sql } from './src/config/db.js';

// Update by email
await sql`UPDATE users SET role = 'SUPERVISOR' WHERE email = 'your@email.com'`;

// Or update by ID
await sql`UPDATE users SET role = 'SUPERVISOR' WHERE id = 1`;

// Check the update
await sql`SELECT * FROM users WHERE email = 'your@email.com'`;
```

---

### **Method 3: List All Users First**

To see all users and their current roles:

```bash
cd backend
node src/scripts/update-user-role.js
```

This will show you all available users and their emails.

---

## 📋 Available Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `PC` | Field Staff / Promoter | Check-in, Submit tasks |
| `SUPERVISOR` | MC / Supervisor | Review & approve tasks |
| `ADMIN` | Administrator | Full system access |
| `SALES` | Sales Team | View reports |
| `VENDOR` | Vendor | View promotions |

---

## 🔍 Find Your Email

If you don't know your email in the system:

```bash
cd backend
node -e "import('./src/config/db.js').then(({sql}) => sql\`SELECT id, name, email, role FROM users\`.then(console.table))"
```

This will show a table of all users.

---

## ✅ Verify the Change

After updating, verify your role:

1. **Restart the mobile app**
2. **Login again**
3. **Check the home screen** - you should see:
   - MC Dashboard (featured)
   - Review Tasks
   - Visit History

---

## 🚨 Troubleshooting

### Issue: "User not found"
**Solution:** Make sure you've logged in to the app at least once. The user is created on first login.

### Issue: "Role not changing in app"
**Solution:** 
1. Close the mobile app completely
2. Clear app cache (optional)
3. Restart the app
4. Login again

### Issue: "Can't run the script"
**Solution:** Make sure you're in the backend directory and have run `npm install`

---

## 📝 Example Session

```bash
# Navigate to backend
cd /Users/taponwat.p/Documents/GitHub/PC-app/wallet-app-expo-master-3/backend

# List all users (optional)
node src/scripts/update-user-role.js

# Update your role
node src/scripts/update-user-role.js john@example.com SUPERVISOR

# Output:
# 🔄 Updating user role...
# Email: john@example.com
# New Role: SUPERVISOR
#
# ✅ User role updated successfully!
#
# User Details:
#   ID: 1
#   Name: John Doe
#   Email: john@example.com
#   Role: SUPERVISOR
#   Clerk ID: user_xxxxxxxxxxxxx
#
# ✨ Done! Please restart your mobile app to see the changes.
```

---

## 🎉 What You'll See After Change

### As SUPERVISOR (MC):

**Home Screen Modules:**
- 📊 **MC Dashboard** (featured) - Review pending tasks
- ✅ **Review Tasks** - Approve or reject submissions  
- ⏰ **Visit History** - View PC check-ins

**Capabilities:**
- View all pending OSA, Display, Survey submissions
- Approve tasks with one tap
- Reject tasks with reason
- View approval statistics
- Monitor PC performance

---

## 💡 Tips

1. **Keep your email handy** - You'll need it to update the role
2. **Restart the app** - Changes won't show until you restart
3. **Multiple roles** - You can have multiple test users with different roles
4. **Switch back** - Use the same script to change back to PC role if needed

---

**Need help?** Check the script output for detailed error messages!
