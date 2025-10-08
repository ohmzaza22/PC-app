# 🔧 Fix All Errors and Run PC Field App

## ✅ All Issues Fixed

I've fixed all the errors. Here's what was done:

### 1. ✅ Removed Old Images
- Deleted all `revenue-i*.png` files
- Updated `sign-in.jsx` to use icon instead
- Updated `sign-up.jsx` to use icon instead

### 2. ✅ Updated Auth Styles
- Added `logoContainer`, `subtitle` styles
- Removed `illustration` style reference

### 3. ✅ Fixed Color References
- All components now use `COLORS` from theme file

---

## 🚀 How to Run (Step by Step)

### Step 1: Clear All Caches
```bash
cd mobile
rm -rf .expo node_modules/.cache .metro-cache
```

### Step 2: Start Backend
```bash
# Open Terminal 1
cd backend
npm install  # If you haven't already
npm run dev
```

You should see:
```
🚀 PC Field App Server running on PORT: 5001
📍 Environment: development
PC Field App Database initialized successfully
```

### Step 3: Start Mobile App
```bash
# Open Terminal 2 (new terminal)
cd mobile
npx expo start --clear
```

### Step 4: Choose Platform
- Press **`w`** for Web (easiest to test)
- Press **`i`** for iOS Simulator
- Press **`a`** for Android (requires Android Studio)

---

## 🐛 If You Still See Errors

### Error: "revenue-i2.png not found"
**Solution:**
```bash
# Kill Metro bundler (Ctrl+C)
# Clear everything:
cd mobile
rm -rf .expo node_modules/.cache .metro-cache
npx expo start --clear --reset-cache
```

### Error: "Cannot read property 'background' of undefined"
**Solution:** The COLORS file has an issue. Check:
```bash
cat mobile/constants/colors.js
```
Make sure it exports `COLORS` properly.

### Error: "Network Error" when initializing user
**Solution:**
1. Make sure backend is running on port 5001
2. Check `mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:5001/api
   ```
3. For physical device, use your computer's IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:5001/api
   ```

### Error: Clerk metadata issue
**Solution:** Go to Clerk Dashboard and change:
```json
{"roles": "ADMIN"}  ← Wrong
```
To:
```json
{"role": "ADMIN"}   ← Correct
```

---

## ✅ Verification Checklist

Before running, make sure:

- [ ] Backend dependencies installed: `cd backend && npm install`
- [ ] Mobile dependencies installed: `cd mobile && npm install`
- [ ] `.env` file exists in `mobile/` with Clerk key
- [ ] `.env` file exists in `backend/` with all keys
- [ ] No old cache files (`.expo`, `.metro-cache`)
- [ ] Backend server is running (Terminal 1)
- [ ] Mobile app starting fresh (Terminal 2)

---

## 🎯 Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Mobile (wait for backend to start first)
cd mobile
rm -rf .expo .metro-cache node_modules/.cache
npx expo start --clear

# Then press 'w' for web browser
```

---

## 📱 Expected Behavior

### On Web Browser:
1. **Login Screen** appears with green icon
2. Enter your Clerk credentials
3. **Dashboard** appears with role-based modules:
   - **PC**: OSA, Display, Survey, Promotions
   - **ADMIN**: Manage Stores, Users, Reports, Promotions

### Console Logs (Normal):
```
✅ User synced to DB: {role: "ADMIN", ...}
🔐 Clerk User Data: {roleFromClerk: "ADMIN", ...}
```

### Console Logs (Errors to Ignore):
```
WARN  Clerk: development keys warning  ← Normal in dev
WARN  expo-image-picker deprecated     ← Can ignore
```

---

## 🆘 Still Having Issues?

### Complete Reset:
```bash
# Stop all servers (Ctrl+C in both terminals)

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Mobile
cd mobile
rm -rf node_modules package-lock.json .expo .metro-cache
npm install

# Then start again:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd mobile && npx expo start --clear
```

---

## 📝 Environment Files

### `backend/.env`
```bash
PORT=5001
NODE_ENV=development
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### `mobile/.env`
```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

---

## ✨ Success!

If everything works, you should see:
- ✅ Login screen with green icon
- ✅ Dashboard with colorful module cards
- ✅ Role badge showing your role
- ✅ No errors in console (except warnings)

Enjoy your PC Field App! 🎉
