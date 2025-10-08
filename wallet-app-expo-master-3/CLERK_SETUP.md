# 🔐 Clerk Setup Guide for PC Field App

## ⚠️ IMPORTANT: Fix Your Clerk Metadata

### The Problem
Your Clerk user has **`"roles": "ADMIN"`** but it should be **`"role": "ADMIN"`** (singular, not plural)

### How to Fix

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to Users**
3. **Click on your user** (doublepootis@gmail.com)
4. **Go to Metadata tab** → **Public Metadata**
5. **Change this:**
   ```json
   {
     "roles": "ADMIN"
   }
   ```
   **To this:**
   ```json
   {
     "role": "ADMIN"
   }
   ```
6. **Click Save**

---

## 📱 Test the Role Change

### Step 1: Clear App Cache
```bash
# Stop Expo (Ctrl+C)
# Then restart with cache cleared:
npx expo start --clear
```

### Step 2: Log Out and Log Back In
1. Open the app
2. Tap the logout button
3. Log in again with your email

### Step 3: Check Console Logs
You should see:
```
🔐 Clerk User Data: {
  "email": "doublepootis@gmail.com",
  "publicMetadata": {"role": "ADMIN"},
  "roleFromClerk": "ADMIN"  ← Should be ADMIN now, not PC
}
```

### Step 4: Verify Dashboard
After logging in, you should see **Admin modules**:
- 🏪 Manage Stores
- 👥 Manage Users
- 📊 View Reports
- 📤 Upload Promotions

---

## 🎯 Setting Up Different Roles

### For PC (Field Staff):
```json
{
  "role": "PC"
}
```

### For Supervisor:
```json
{
  "role": "SUPERVISOR"
}
```

### For Admin:
```json
{
  "role": "ADMIN"
}
```

### For Sales/Vendor:
```json
{
  "role": "SALES"
}
```
or
```json
{
  "role": "VENDOR"
}
```

---

## 🐛 Troubleshooting

### Issue: Role still shows as "PC"
**Solution:**
1. Clear AsyncStorage cache
2. Log out completely
3. Close the app
4. Reopen and log in

### Issue: "Network Error" when initializing user
**Solution:**
1. Make sure backend is running: `cd backend && npm run dev`
2. Check API URL in `mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:5001/api
   ```
3. If using physical device, use your computer's IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:5001/api
   ```

### Issue: Backend not accessible
**Solution:**
```bash
# Terminal 1: Start backend
cd backend
npm install
npm run dev

# Terminal 2: Start mobile
cd mobile
npm install
npx expo start
```

---

## ✅ Verification Checklist

- [ ] Clerk metadata uses `"role"` (singular), not `"roles"`
- [ ] Backend server is running on port 5001
- [ ] Mobile app can connect to backend
- [ ] Console shows correct role from Clerk
- [ ] Dashboard displays role-appropriate modules
- [ ] Can access role-specific features

---

## 📝 Notes

- **Development Mode**: Clerk shows a warning about development keys - this is normal
- **Role Changes**: Always log out and back in after changing roles in Clerk
- **Cache Issues**: Use `npx expo start --clear` if you see stale data
- **Network Errors**: Ensure backend is running before starting mobile app

---

## 🚀 Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Mobile (new terminal)
cd mobile
npx expo start --clear

# Then press 'i' for iOS or 'a' for Android
```
