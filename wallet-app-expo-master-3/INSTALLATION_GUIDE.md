# Installation Guide for New Features

## 📦 Required Packages

### Mobile App Packages

Run these commands in the `/mobile` directory:

```bash
# Photo watermark and manipulation
npm install react-native-image-marker
npm install expo-image-manipulator

# Charts and visualizations
npm install react-native-chart-kit react-native-svg

# File system operations
npm install expo-file-system

# Excel/CSV export
npm install xlsx

# Push notifications
npx expo install expo-notifications

# Offline storage
npm install @react-native-async-storage/async-storage

# Network status detection
npx expo install @react-native-community/netinfo

# Date utilities
npm install date-fns
```

### Backend Packages

Run these commands in the `/backend` directory:

```bash
# Excel generation for reports
npm install exceljs

# CSV generation
npm install csv-writer

# Email service (for report delivery)
npm install nodemailer

# Enhanced cron for scheduled tasks
npm install node-cron
```

## 🚀 Installation Steps

### 1. Install Mobile Dependencies
```bash
cd mobile
npm install
```

### 2. Install Backend Dependencies
```bash
cd ../backend
npm install
```

### 3. Run Database Migration
```bash
cd backend
node src/migrations/enhance-schema.js
```

### 4. Configure Environment Variables

Add to `/backend/.env`:
```env
# Email configuration (for reports)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Push notification configuration
EXPO_PUSH_TOKEN_URL=https://exp.host/--/api/v2/push/send

# GPS validation settings
GPS_VALIDATION_RADIUS_METERS=100

# Offline sync settings
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY_MS=5000
```

### 5. Clear Cache and Restart

```bash
# Mobile
cd mobile
rm -rf node_modules
npm install
npx expo start -c

# Backend
cd backend
rm -rf node_modules
npm install
npm run dev
```

## ✅ Verification

After installation, verify:

1. **Database**: Check that new tables exist
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

2. **Mobile App**: Should start without errors
   ```bash
   cd mobile && npx expo start
   ```

3. **Backend**: Should start without errors
   ```bash
   cd backend && npm run dev
   ```

## 🔧 Troubleshooting

### Issue: "Module not found" errors
**Solution**: Clear cache and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database migration fails
**Solution**: Check DATABASE_URL in .env and ensure PostgreSQL is running

### Issue: Expo notifications not working
**Solution**: Ensure you're testing on a physical device (notifications don't work in simulator)

### Issue: Image marker not working
**Solution**: Rebuild the app after installing native dependencies
```bash
npx expo prebuild
npx expo run:ios  # or run:android
```

## 📱 Platform-Specific Notes

### iOS
- Notifications require physical device
- Location permissions must be granted
- Camera permissions must be granted

### Android
- Enable location services
- Grant camera and storage permissions
- Background location permission for offline sync

## 🎯 Next Steps

After successful installation:
1. Test check-in functionality
2. Test photo capture with watermark
3. Test offline mode
4. Test push notifications

---

**Installation complete!** Ready to use the enhanced features. 🚀
