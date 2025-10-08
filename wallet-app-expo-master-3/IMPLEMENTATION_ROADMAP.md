# Field Force Management App - Implementation Roadmap

## ✅ Completed: Database Schema Enhancement

### New Tables Created:
1. **store_visits** - Check-in/check-out tracking with GPS
2. **survey_templates** - Dynamic survey form builder
3. **notifications** - Push notification system
4. **sync_queue** - Offline mode sync tracking
5. **dashboard_stats** - Performance view for analytics

### Enhanced Tables:
- **osa_records** - Added status, approval workflow, GPS, visit_id
- **displays** - Added status, approval workflow, GPS, visit_id
- **surveys** - Added status, approval workflow, GPS, visit_id
- **promotions** - Added campaign_name, assigned_stores

---

## 🚀 Implementation Plan

### **Phase 1: Core Check-in/GPS System** (Priority: HIGH)
**Status**: Ready to implement

#### 1.1 Check-in/Check-out System
- [ ] Create `CheckInScreen.jsx` with GPS capture
- [ ] GPS validation (must be within X meters of store)
- [ ] Store visit tracking
- [ ] Manual check-out button
- [ ] Backend API endpoints for check-in/check-out

#### 1.2 GPS Validation Middleware
- [ ] Calculate distance between PC and store location
- [ ] Block task access if not checked in
- [ ] Block task access if too far from store
- [ ] Show distance indicator to PC

#### 1.3 Photo Watermark
- [ ] Install `react-native-image-marker` or similar
- [ ] Add timestamp watermark to all photos
- [ ] Add GPS coordinates watermark
- [ ] Compress images for offline storage

---

### **Phase 2: Approval Workflow** (Priority: HIGH)
**Status**: Database ready

#### 2.1 Task Status Management
- [ ] Update OSA, Display, Survey submissions with status
- [ ] Add GPS location to all submissions
- [ ] Link submissions to visit_id

#### 2.2 MC/Supervisor Approval Interface
- [ ] Create approval dashboard for MC
- [ ] Individual task review screens
- [ ] Approve/Reject with reason
- [ ] Bulk approval option

#### 2.3 Resubmission Flow
- [ ] Show rejected tasks to PC
- [ ] Allow editing and resubmission
- [ ] Track submission history
- [ ] Notification on rejection

---

### **Phase 3: Dashboard & Analytics** (Priority: MEDIUM)
**Status**: Database view created

#### 3.1 Role-Based Dashboards
- [ ] **PC Dashboard**: Today's tasks, pending submissions, rejected items
- [ ] **MC Dashboard**: Pending approvals, team performance, rejection rate
- [ ] **Admin Dashboard**: System-wide stats, completion rates, export options
- [ ] **Vendor Dashboard**: Campaign results, coverage, execution quality

#### 3.2 Charts & Visualizations
- [ ] Install `react-native-chart-kit` or `victory-native`
- [ ] Completion rate chart (daily/weekly/monthly)
- [ ] Store coverage map
- [ ] Task type breakdown (pie chart)
- [ ] Approval rate trends (line chart)

#### 3.3 Report Export
- [ ] Install `react-native-fs` and `xlsx` library
- [ ] Generate Excel/CSV reports
- [ ] Filter by date range, store, PC, campaign
- [ ] Include photos in ZIP export
- [ ] Email report option

---

### **Phase 4: Push Notifications** (Priority: MEDIUM)
**Status**: Database table created

#### 4.1 Notification System
- [ ] Install `expo-notifications`
- [ ] Setup push notification tokens
- [ ] Backend notification service
- [ ] Notification types:
  - New promotion uploaded
  - Task rejected (with reason)
  - Daily reminder (morning check-in)
  - Approval status changed
  - Campaign deadline approaching

#### 4.2 In-App Notifications
- [ ] Notification bell icon with badge
- [ ] Notification list screen
- [ ] Mark as read functionality
- [ ] Deep linking to relevant screens

---

### **Phase 5: Dynamic Survey Forms** (Priority: MEDIUM)
**Status**: Database table created

#### 5.1 Survey Template Builder (Admin)
- [ ] Create survey template form
- [ ] Add/remove questions dynamically
- [ ] Question types: Text, Number, Multiple Choice, Photo, Date
- [ ] Assign to stores or campaigns
- [ ] Preview survey before publishing

#### 5.2 Survey Execution (PC)
- [ ] Load assigned surveys for store
- [ ] Dynamic form rendering
- [ ] Validation rules
- [ ] Save draft (offline support)
- [ ] Submit with photos

#### 5.3 Survey Analysis (Admin/Vendor)
- [ ] View survey responses
- [ ] Export survey data to Excel
- [ ] Aggregate results by question
- [ ] Compare across stores/campaigns

---

### **Phase 6: Offline Mode** (Priority: HIGH)
**Status**: Database sync_queue created

#### 6.1 Local Storage
- [ ] Install `@react-native-async-storage/async-storage`
- [ ] Install `react-native-sqlite-storage` for complex data
- [ ] Store user data, stores, templates locally
- [ ] Cache photos locally

#### 6.2 Offline Task Execution
- [ ] Allow check-in offline (queue for sync)
- [ ] Allow task submission offline
- [ ] Store photos locally with metadata
- [ ] Show offline indicator

#### 6.3 Sync Mechanism
- [ ] Detect online/offline status
- [ ] Auto-sync when online
- [ ] Manual sync button
- [ ] Conflict resolution
- [ ] Show sync progress
- [ ] Retry failed syncs

---

## 📦 Required NPM Packages

### Mobile App:
```bash
# Photo watermark
npm install react-native-image-marker

# Charts
npm install react-native-chart-kit react-native-svg

# File system & Excel export
npm install react-native-fs xlsx

# Notifications
expo install expo-notifications

# Offline storage
npm install @react-native-async-storage/async-storage
npm install react-native-sqlite-storage

# Network status
expo install @react-native-community/netinfo
```

### Backend:
```bash
# Excel generation
npm install exceljs

# Email service (optional)
npm install nodemailer

# Cron jobs for reminders
npm install node-cron
```

---

## 🎯 Success Metrics

### For PC:
- ✅ Can check-in only at correct location
- ✅ All photos have timestamp watermark
- ✅ Can work offline and sync later
- ✅ Receives notifications for rejections

### For MC/Supervisor:
- ✅ Can approve/reject each task individually
- ✅ Can see pending approvals dashboard
- ✅ Can add rejection reasons

### For Admin:
- ✅ Can export reports in Excel/CSV
- ✅ Can create dynamic survey forms
- ✅ Can view system-wide dashboard
- ✅ Can send notifications to users

### For Vendor/Sales:
- ✅ Can view campaign execution results
- ✅ Can access reports and analytics
- ✅ Can upload promotions with assignments

---

## 🔄 Next Steps

1. **Implement Check-in System** (1-2 days)
2. **Add Photo Watermark** (1 day)
3. **Build Approval Workflow** (2-3 days)
4. **Create Dashboards** (2-3 days)
5. **Add Notifications** (1-2 days)
6. **Build Survey Builder** (2-3 days)
7. **Implement Offline Mode** (3-4 days)
8. **Testing & Bug Fixes** (2-3 days)

**Total Estimated Time**: 14-21 days

---

## 📝 Notes

- All features will be built incrementally
- Each phase will be tested before moving to next
- Database schema is already prepared
- Existing features (OSA, Display, Survey, Promotions) will be enhanced, not rebuilt
- Focus on mobile app first, then admin web interface (if needed)

---

**Ready to start implementation!** 🚀
