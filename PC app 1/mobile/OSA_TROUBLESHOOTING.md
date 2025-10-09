# 🔧 OSA Submission Troubleshooting Guide

## What Was Fixed

The OSA submission was failing due to multiple issues. Here's what was improved:

### 1. ✅ Authentication Token
- Added fresh token retrieval before submission
- Token is now refreshed on every OSA submit
- Better token validation with clear error messages

### 2. ✅ Photo Upload Format
- Fixed React Native photo URI format (iOS/Android differences)
- Proper FormData structure for multipart uploads
- Added fallback for missing photo metadata

### 3. ✅ Timeout Extension
- Increased timeout from 10s to 60s for photo uploads
- Applies to OSA, Display, Survey, and Promotion uploads
- Prevents timeout errors on slow connections

### 4. ✅ Better Error Handling
- Detailed error messages for different failure types
- Console logging for debugging
- User-friendly error descriptions

---

## 🐛 Common Error Messages & Solutions

### Error: "Authentication token not found"
**Cause**: User's session expired or token not available  
**Solution**: 
```
1. Sign out of the app
2. Sign back in
3. Try submitting again
```

### Error: "Authentication failed. Please sign in again."
**Cause**: Backend rejected the token (401 error)  
**Solution**:
```
1. Check if backend server is running
2. Verify API_URL in .env is correct
3. Sign out and sign in again
```

### Error: "Network error. Please check your internet connection."
**Cause**: Cannot reach the backend server  
**Solution**:
```
1. Check if backend is running at the API_URL
2. Verify your device has internet connection
3. If using localhost, ensure device is on same network
4. For iOS simulator: use http://localhost:5001
5. For Android emulator: use http://10.0.2.2:5001
6. For physical device: use your computer's IP address
```

### Error: "Request timeout. Please try again."
**Cause**: Upload took longer than 60 seconds  
**Solution**:
```
1. Check your internet connection speed
2. Try compressing the photo (already set to 0.8 quality)
3. Ensure backend is responding quickly
4. Check backend logs for processing delays
```

### Error: "Invalid data. Please check all fields."
**Cause**: Backend validation failed (400 error)  
**Solution**:
```
1. Ensure all required fields are filled:
   - Store selected
   - At least one product added
   - All products have quantity > 0
   - Photo captured/selected
2. Check backend validation rules
3. Look at console logs for specific validation errors
```

---

## 📋 Pre-Submission Checklist

Before submitting an OSA record, verify:

- [ ] **Backend is running** at the API URL
- [ ] **Signed in** with valid credentials
- [ ] **Store selected** from the dropdown
- [ ] **Photo taken or selected** (preview visible)
- [ ] **At least one product** added
- [ ] **All products have quantity** (not 0 or empty)
- [ ] **Internet connection** active
- [ ] **Not on a VPN** that blocks local network

---

## 🔍 Debugging Steps

### Step 1: Check Backend Connection

Test if the backend is reachable:

```bash
# In the backend directory
cd /Users/taponwat.p/Documents/GitHub/PC-app/PC\ app\ 1/backend
npm run dev

# You should see:
# Server running on port 5001
```

### Step 2: Verify API URL

Check your `.env` file:

```bash
cat /Users/taponwat.p/Documents/GitHub/PC-app/PC\ app\ 1/mobile/.env
```

Should contain:
```
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

**Important**: 
- **iOS Simulator**: Use `http://localhost:5001/api`
- **Android Emulator**: Use `http://10.0.2.2:5001/api`
- **Physical Device**: Use `http://YOUR_COMPUTER_IP:5001/api`

### Step 3: Check Console Logs

When you tap "Submit OSA Record", check the terminal logs:

**Look for:**
```
Submitting OSA with: { store_id: X, products: Y, hasPhoto: true }
```

**If successful:**
```
OSA submission response: { id: X, message: "..." }
```

**If failed:**
```
Error submitting OSA: [error details]
Error response: [backend error message]
```

### Step 4: Test with Postman/cURL

Test the backend OSA endpoint directly:

```bash
curl -X POST http://localhost:5001/api/osa \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "store_id=1" \
  -F "products=[{\"name\":\"Test\",\"quantity\":\"5\",\"stockLevel\":\"Full\"}]" \
  -F "remarks=Test" \
  -F "photo=@/path/to/test/image.jpg"
```

---

## 🛠️ Advanced Debugging

### Enable Network Logging

Add this to your app to see all API requests:

In `/mobile/lib/api.js`, add:

```javascript
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', {
    method: config.method,
    url: config.url,
    headers: config.headers,
    data: config.data instanceof FormData ? 'FormData' : config.data,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.log('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);
```

### Check Backend Database

Verify the store exists:

```sql
-- In your database
SELECT * FROM stores WHERE id = YOUR_STORE_ID;
```

Verify user has permission:

```sql
SELECT * FROM users WHERE clerk_id = 'YOUR_CLERK_ID';
```

---

## 📱 Testing on Different Platforms

### iOS Simulator
```bash
# Backend should use localhost
EXPO_PUBLIC_API_URL=http://localhost:5001/api

# Run app
npx expo run:ios
```

### Android Emulator
```bash
# Backend needs special IP
EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api

# Run app
npx expo run:android
```

### Physical Device (iOS/Android)
```bash
# Find your computer's IP address
# macOS:
ifconfig | grep "inet "

# Use your computer's IP
EXPO_PUBLIC_API_URL=http://192.168.1.X:5001/api

# Make sure backend allows connections from network
# In backend, change:
app.listen(5001, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:5001');
});
```

---

## 🔐 Backend Requirements

Your backend needs to handle multipart/form-data for OSA:

```javascript
// Express backend example
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/osa', upload.single('photo'), async (req, res) => {
  try {
    const { store_id, remarks, products } = req.body;
    const photo = req.file;
    
    // Validate
    if (!store_id) return res.status(400).json({ message: 'Store ID required' });
    if (!photo) return res.status(400).json({ message: 'Photo required' });
    if (!products) return res.status(400).json({ message: 'Products required' });
    
    // Save to database
    // ... your logic ...
    
    res.json({ message: 'OSA created', id: newOSA.id });
  } catch (error) {
    console.error('OSA creation error:', error);
    res.status(500).json({ message: error.message });
  }
});
```

---

## ✅ Quick Test Script

Run this to verify everything:

```bash
#!/bin/bash

echo "🔍 Testing OSA Submission Setup..."

# 1. Check backend
echo "\n1. Checking backend..."
curl -s http://localhost:5001/health && echo "✅ Backend reachable" || echo "❌ Backend not running"

# 2. Check .env
echo "\n2. Checking .env..."
grep "EXPO_PUBLIC_API_URL" /Users/taponwat.p/Documents/GitHub/PC-app/PC\ app\ 1/mobile/.env || echo "❌ API_URL not configured"

# 3. Check mobile dependencies
echo "\n3. Checking dependencies..."
cd /Users/taponwat.p/Documents/GitHub/PC-app/PC\ app\ 1/mobile
npm list expo-image-picker && echo "✅ expo-image-picker installed" || echo "❌ expo-image-picker missing"

echo "\n✅ Setup check complete!"
```

---

## 📞 Support

If OSA submission still fails after all these steps:

1. **Check console logs** - Look for specific error messages
2. **Check backend logs** - See what the server received
3. **Verify permissions** - Camera and storage access granted
4. **Test network** - Ensure device can reach backend
5. **Check database** - Verify store and user exist

---

## 🎯 Expected Flow

### Successful OSA Submission:

1. User fills in all fields
2. User taps "Submit OSA Record"
3. App shows "Submitting..." (button disabled)
4. **Console logs**: "Submitting OSA with: {...}"
5. App sends request to backend
6. Backend processes and saves to database
7. Backend returns success response
8. **Console logs**: "OSA submission response: {...}"
9. App shows "Success" alert
10. User taps "OK"
11. App navigates back to previous screen

### Failed Submission (with new error handling):

1. User fills in all fields
2. User taps "Submit OSA Record"
3. App shows "Submitting..."
4. **Console logs**: "Submitting OSA with: {...}"
5. App sends request to backend
6. **Error occurs** (network, timeout, validation, etc.)
7. **Console logs**: "Error submitting OSA: [details]"
8. **Console logs**: "Error response: [backend response]"
9. App shows **specific error message** in alert:
   - Network error → "Network error. Please check connection."
   - Auth error → "Authentication failed. Please sign in."
   - Timeout → "Request timeout. Please try again."
   - Validation → "Invalid data. Please check all fields."
   - Other → Backend's error message
10. User can try again with corrected data

---

**Last Updated**: 2025-10-09  
**Status**: ✅ Enhanced with better error handling  
**Timeout**: 60 seconds for photo uploads
