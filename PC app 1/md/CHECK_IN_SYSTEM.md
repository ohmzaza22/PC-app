# Check-In / Check-Out System

## Overview
Complete implementation of check-in/check-out system with task completion gating for PC (Product Champion) staff.

---

## ✅ Features Implemented

### 1. **Check-In Requirements**
- ✅ GPS location (latitude, longitude, accuracy)
- ✅ Date & time (auto-captured, stored in UTC)
- ✅ PC name (from authenticated user profile)
- ✅ Store selection
- ✅ GPS proximity validation (within 100m of store)
- ✅ Prevents duplicate check-ins on same day

### 2. **Check-Out Gating**
- ✅ Check-out button disabled until all required tasks completed
- ✅ Validates task completion before allowing check-out
- ✅ Shows list of incomplete tasks if attempted early
- ✅ Captures GPS location on check-out

### 3. **Task Assignment System**
- ✅ Auto-creates task assignments on check-in
- ✅ Default required tasks: OSA, Display, Survey
- ✅ Auto-updates task status when records are submitted
- ✅ Tracks task completion progress

### 4. **Main Page UI**
- ✅ Session status card showing:
  - Check-in status (Active/Not Checked In)
  - PC name, store, date, time
  - GPS location (read-only)
  - Task completion progress bar
- ✅ Task checklist with status indicators
- ✅ Check-out button (enabled/disabled based on tasks)

---

## 🗄️ Database Schema

### **task_assignments** Table
```sql
CREATE TABLE task_assignments (
  id SERIAL PRIMARY KEY,
  visit_id INT REFERENCES store_visits(id),
  task_type TEXT CHECK (task_type IN ('OSA','DISPLAY','SURVEY','PROMOTION')),
  is_required BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED')),
  completed_at TIMESTAMP,
  task_record_id INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **store_visits** Table (Enhanced)
```sql
ALTER TABLE store_visits 
ADD COLUMN session_status TEXT 
CHECK (session_status IN ('IN_PROGRESS','COMPLETED','INCOMPLETE'));
```

### **Automatic Task Tracking**
- Trigger auto-creates 3 default tasks on check-in
- Trigger auto-updates task status when OSA/Display/Survey records created
- Links task records to visit via `visit_id` foreign key

---

## 📡 API Endpoints

### Check-In
```http
POST /api/store-visits/check-in
Authorization: Bearer <token>

Request:
{
  "store_id": 1,
  "location": {
    "latitude": 37.7858,
    "longitude": -122.4064,
    "accuracy": 10,
    "timestamp": "2024-10-08T10:00:00Z"
  }
}

Response 201:
{
  "message": "Checked in successfully",
  "visit": { ... }
}

Response 400 (too far):
{
  "message": "You must be within 100m of the store to check in",
  "distance": 250,
  "maxDistance": 100
}
```

### Check-Out (with Task Validation)
```http
POST /api/store-visits/check-out
Authorization: Bearer <token>

Request:
{
  "visit_id": 123,
  "location": {
    "latitude": 37.7858,
    "longitude": -122.4064,
    "accuracy": 10,
    "timestamp": "2024-10-08T17:00:00Z"
  }
}

Response 200:
{
  "message": "Checked out successfully",
  "visit": { ... }
}

Response 400 (incomplete tasks):
{
  "message": "You must complete all required tasks before checking out",
  "incompleteTasks": [
    { "taskType": "DISPLAY", "status": "PENDING" },
    { "taskType": "SURVEY", "status": "PENDING" }
  ]
}
```

### Get Current Visit (with Tasks)
```http
GET /api/store-visits/current
Authorization: Bearer <token>

Response 200:
{
  "visit": {
    "id": 123,
    "store_id": 1,
    "store_name": "Store ABC",
    "pc_id": 5,
    "pc_name": "John Doe",
    "check_in_time": "2024-10-08T10:00:00Z",
    "check_in_location": { ... },
    "status": "CHECKED_IN",
    "session_status": "IN_PROGRESS"
  },
  "tasks": [
    {
      "id": 1,
      "task_type": "OSA",
      "is_required": true,
      "status": "COMPLETED",
      "completed_at": "2024-10-08T11:00:00Z"
    },
    {
      "id": 2,
      "task_type": "DISPLAY",
      "is_required": true,
      "status": "PENDING",
      "completed_at": null
    },
    {
      "id": 3,
      "task_type": "SURVEY",
      "is_required": true,
      "status": "PENDING",
      "completed_at": null
    }
  ],
  "stats": {
    "totalRequired": 3,
    "completedRequired": 1,
    "canCheckOut": false
  }
}
```

---

## 📱 Mobile Components

### **CheckInStatus Component**
Location: `/mobile/components/CheckInStatus.jsx`

**Features:**
- Shows "Not Checked In" state with call-to-action
- Shows active session details when checked in
- Displays task progress bar
- Shows task checklist with completion status
- Check-out button with validation
- Handles location permissions
- Shows blocking modal for incomplete tasks

**Props:**
```javascript
<CheckInStatus 
  currentVisit={visit}      // Current visit object or null
  tasks={tasks}             // Array of task assignments
  stats={stats}             // { totalRequired, completedRequired, canCheckOut }
  onRefresh={fetchVisit}    // Callback to refresh data
/>
```

### **PageHeader Component**
Location: `/mobile/components/PageHeader.jsx`

**Features:**
- Reusable header with back button
- Safe area padding for iOS/Android
- Larger touch targets (hitSlop)
- Optional right component
- Consistent styling

---

## 🔄 Business Logic Flow

### Check-In Flow:
1. PC opens Check-In page
2. Selects store from nearby list (within 5km)
3. App requests GPS location
4. Validates PC is within 100m of store
5. Creates `store_visits` record with status='CHECKED_IN'
6. **Trigger auto-creates 3 task assignments** (OSA, Display, Survey)
7. Redirects to main page showing active session

### Task Submission Flow:
1. PC submits OSA/Display/Survey record
2. Backend links record to current visit via `visit_id`
3. **Trigger auto-updates corresponding task assignment to 'COMPLETED'**
4. Main page refreshes showing updated progress

### Check-Out Flow:
1. PC taps Check-Out button on main page
2. App validates all required tasks are completed
3. If incomplete: Shows blocking modal with task list
4. If complete: Confirms check-out
5. Captures GPS location
6. Updates visit: status='CHECKED_OUT', session_status='COMPLETED'
7. PC can now check in to another store

---

## 🚀 Setup Instructions

### 1. Run Database Migration
```bash
cd backend
node src/migrations/add-task-assignments.js
```

This creates:
- `task_assignments` table
- Triggers for auto task creation/update
- Indexes for performance
- `session_status` column in `store_visits`

### 2. Restart Backend Server
```bash
npm run dev
```

### 3. Test Mobile App
```bash
cd mobile
npx expo start
```

---

## 🧪 Testing Checklist

### Check-In Tests:
- [ ] Can check in when within 100m of store
- [ ] Cannot check in when too far from store
- [ ] Cannot check in twice to same store on same day
- [ ] Location permission request works
- [ ] Check-in creates 3 task assignments

### Task Completion Tests:
- [ ] Submitting OSA marks OSA task as completed
- [ ] Submitting Display marks Display task as completed
- [ ] Submitting Survey marks Survey task as completed
- [ ] Progress bar updates correctly
- [ ] Task checklist shows correct statuses

### Check-Out Tests:
- [ ] Check-out button disabled when tasks incomplete
- [ ] Tapping disabled button shows incomplete task modal
- [ ] Check-out button enabled when all tasks complete
- [ ] Check-out succeeds with location capture
- [ ] Session marked as COMPLETED

### Main Page Tests:
- [ ] Shows "Not Checked In" when no active session
- [ ] Shows session card with all details when checked in
- [ ] Task progress bar shows correct percentage
- [ ] Task checklist displays all tasks with status
- [ ] Pull-to-refresh updates session status

---

## 📂 Files Modified

### Backend:
- ✅ `/backend/src/migrations/add-task-assignments.js` (NEW)
- ✅ `/backend/src/controllers/storeVisitController.js`
- ✅ `/backend/src/controllers/osaController.js`
- ✅ `/backend/src/controllers/displayController.js`
- ✅ `/backend/src/controllers/surveyController.js`

### Mobile:
- ✅ `/mobile/components/CheckInStatus.jsx` (NEW)
- ✅ `/mobile/components/PageHeader.jsx` (NEW)
- ✅ `/mobile/app/(root)/index.jsx`
- ✅ `/mobile/app/(root)/check-in.jsx`
- ✅ `/mobile/app/(root)/osa.jsx`
- ✅ `/mobile/app/(root)/display.jsx`
- ✅ `/mobile/app/(root)/survey.jsx`
- ✅ `/mobile/app/(root)/promotions.jsx`
- ✅ `/mobile/app/(root)/rejected-tasks.jsx`
- ✅ `/mobile/app/(root)/admin-stores.jsx`
- ✅ `/mobile/app/(root)/admin-reports.jsx`
- ✅ `/mobile/app/(root)/admin-users.jsx`
- ✅ `/mobile/app/(root)/mc-dashboard.jsx`
- ✅ `/mobile/app/(root)/review-tasks.jsx`
- ✅ `/mobile/app/(root)/edit-store.jsx`
- ✅ `/mobile/app/(root)/supervisor-verify.jsx`

---

## 🎯 Business Rules Enforced

1. ✅ **Check-in requires**: Location, Date, Time, PC Name
2. ✅ **Check-out gated by**: All required tasks must be completed
3. ✅ **Task tracking**: Auto-linked to visit session
4. ✅ **GPS validation**: Must be within 100m of store
5. ✅ **Session status**: IN_PROGRESS → COMPLETED (or INCOMPLETE if not checked out)
6. ✅ **One active session**: Cannot check in twice on same day

---

## 🔮 Future Enhancements

- [ ] Offline queue for check-in/check-out
- [ ] Push notifications for incomplete sessions
- [ ] Supervisor override for early check-out
- [ ] Configurable required tasks per store
- [ ] Time-based auto check-out (end of shift)
- [ ] Session analytics and reports
- [ ] Geofencing alerts

---

## 🐛 Known Limitations

1. **Database Migration**: Requires manual run when database is accessible
2. **Offline Support**: Not yet implemented (queued for future)
3. **Task Configuration**: Currently hardcoded (OSA, Display, Survey)

---

## 📞 Support

If you encounter issues:
1. Ensure database migration has run successfully
2. Check backend logs for API errors
3. Verify location permissions are granted
4. Test GPS accuracy in open area
5. Check network connectivity for API calls
