# 📷 Photo Upload Setup Guide

## Issue: "Unknown API key - your_cloudinary_api_key"

Your OSA submission fails because the backend needs photo storage configured.

---

## ✅ Solution: Choose One Option

### **Option 1: Use Cloudinary (Cloud Storage) - Recommended**

**Pros:**
- ✅ Free tier available (25GB storage)
- ✅ Automatic image optimization
- ✅ CDN delivery (fast worldwide)
- ✅ No server disk space used

**Setup Steps:**

1. **Get Cloudinary Account** (2 minutes)
   - Go to: https://cloudinary.com/users/register_free
   - Sign up for free
   - After login, you'll see your Dashboard with:
     - Cloud Name
     - API Key
     - API Secret

2. **Update Backend `.env`**
   ```bash
   # Edit: /Users/taponwat.p/Documents/GitHub/PC-app/PC app 1/backend/.env
   
   # Add these lines with your actual credentials:
   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   CLOUDINARY_API_KEY=your_actual_api_key_number
   CLOUDINARY_API_SECRET=your_actual_api_secret
   ```

3. **Switch to Cloudinary Upload**
   
   Edit `/backend/src/routes/osaRoute.js`:
   ```javascript
   // Uncomment this line:
   import { upload } from "../utils/upload.js"; // Cloudinary
   
   // Comment out this line:
   // import { upload } from "../utils/upload-local.js"; // Local storage
   ```

4. **Restart Backend**
   ```bash
   # Stop server (Ctrl+C) and restart:
   npm run dev
   ```

✅ **Done!** OSA photos will upload to Cloudinary.

---

### **Option 2: Use Local Storage (Disk Storage) - Already Configured**

**Pros:**
- ✅ No external service needed
- ✅ Complete control
- ✅ No account signup required

**Cons:**
- ⚠️ Uses server disk space
- ⚠️ No CDN (slower for distant users)
- ⚠️ Manual backups needed

**Setup Steps:**

1. **Already Done!** 
   - I already configured local storage
   - Files saved to `/backend/uploads/`
   - Route already uses `upload-local.js`

2. **Just Restart Backend**
   ```bash
   # Stop server (Ctrl+C) and restart:
   npm run dev
   ```

✅ **Done!** OSA photos will save to local disk.

---

## 🧪 Test the Fix

After choosing and configuring one option:

1. **Restart backend** (important!)
2. **Open mobile app**
3. **Navigate to OSA module**
4. **Fill in all fields:**
   - Select store
   - Add product with quantity
   - Take photo
5. **Tap "Submit OSA Record"**

### Expected Result:
- ✅ "Success" alert appears
- ✅ No "Unknown API key" error
- ✅ Photo uploaded successfully

---

## 🔍 Verify Photo Upload

### **For Cloudinary:**
```bash
# Check backend logs for:
"Cloudinary upload successful"

# Or visit your Cloudinary dashboard:
https://cloudinary.com/console
# Go to Media Library > pc-field-app folder
```

### **For Local Storage:**
```bash
# Check if files are created:
ls -la /Users/taponwat.p/Documents/GitHub/PC-app/PC\ app\ 1/backend/uploads/

# Check backend logs for:
"File uploaded to: uploads/photo-..."

# Access uploaded photo in browser:
http://localhost:5001/uploads/photo-XXXXX.jpg
```

---

## 🔄 Switching Between Options

### Switch TO Cloudinary:
```javascript
// In /backend/src/routes/osaRoute.js:
import { upload } from "../utils/upload.js"; // Cloudinary
// import { upload } from "../utils/upload-local.js"; // Local
```

### Switch TO Local Storage:
```javascript
// In /backend/src/routes/osaRoute.js:
// import { upload } from "../utils/upload.js"; // Cloudinary
import { upload } from "../utils/upload-local.js"; // Local
```

**Remember to restart backend after switching!**

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `/backend/src/utils/upload.js` | Cloudinary configuration |
| `/backend/src/utils/upload-local.js` | Local storage configuration |
| `/backend/src/routes/osaRoute.js` | Choose which upload to use |
| `/backend/src/server.js` | Serves uploaded files |
| `/backend/uploads/` | Local storage directory |
| `/backend/.env` | Cloudinary credentials |

---

## 🐛 Troubleshooting

### Still getting "Unknown API key" error?

1. ✅ Check `.env` file has actual credentials (not placeholders)
2. ✅ Restart backend after editing `.env`
3. ✅ Verify Cloudinary credentials are correct
4. ✅ Check backend logs for Cloudinary connection

### Photos not showing?

**For Cloudinary:**
- Check Cloudinary dashboard Media Library
- Verify upload was successful in backend logs
- Check Cloudinary credentials

**For Local Storage:**
- Check `/backend/uploads/` directory exists
- Verify files are created after upload
- Access file directly: `http://localhost:5001/uploads/filename.jpg`
- Check server logs for file paths

### Backend crashes on upload?

1. Check backend logs for specific error
2. Verify multer is installed: `npm list multer`
3. For Cloudinary: verify credentials
4. For Local: verify write permissions on uploads folder

---

## 💡 Recommended Choice

### Use **Cloudinary** if:
- You want automatic image optimization
- You need CDN delivery
- You don't want to manage disk space
- You plan to scale (many photos)

### Use **Local Storage** if:
- You want complete control
- You prefer no external dependencies
- You have adequate server storage
- You're running on a local network only

---

## 📞 Quick Fix Command

**Most Common Issue: Cloudinary not configured**

```bash
# 1. Go to Cloudinary: https://cloudinary.com/users/register_free
# 2. Copy your credentials from Dashboard
# 3. Edit .env file:

cd /Users/taponwat.p/Documents/GitHub/PC-app/PC\ app\ 1/backend
nano .env

# Add:
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Save (Ctrl+X, Y, Enter)

# 4. Verify osaRoute.js uses Cloudinary:
cat src/routes/osaRoute.js | grep "upload.js"

# Should see: import { upload } from "../utils/upload.js"

# 5. Restart:
npm run dev
```

---

**Status:** ✅ Both options configured and ready  
**Choose one, configure it, restart backend, and try again!**
