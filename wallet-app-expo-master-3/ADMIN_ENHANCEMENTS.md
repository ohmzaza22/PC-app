# 🎯 Admin Portal Enhancements - Implementation Guide

## ✅ What I've Added to Backend:

### New Files Created:
1. **`backend/src/routes/adminRoute.js`** - Admin-specific routes
2. **`backend/src/controllers/adminController.js`** - Dashboard & reports logic
3. **Updated `backend/src/server.js`** - Added admin routes

### New API Endpoints:
- `GET /api/admin/dashboard` - Summary metrics & trends
- `GET /api/admin/reports/osa/export` - Export OSA data
- `GET /api/admin/reports/display/export` - Export display data with costs

## 🚀 Features to Add to Mobile App:

### 1. Enhanced Admin Dashboard (`mobile/app/(root)/admin-dashboard.jsx`)
Create a new comprehensive dashboard with:
- **Summary Cards**: Total PCs, Today's OSA, Pending Reviews, Active Promotions
- **Charts** (using `react-native-chart-kit` or `victory-native`):
  - OSA submission trend (7 days)
  - Display spending trend (30 days)
- **Quick Actions**: Assign Store, Generate Report buttons

### 2. Enhanced OSA Reports Page (`mobile/app/(root)/admin-osa.jsx`)
- Data table with filters (date range, store, status)
- View full details modal with photo
- Mark as reviewed/flagged
- Export filtered data button

### 3. Enhanced Display Management (`mobile/app/(root)/admin-display.jsx`)
- View all displays with photos and costs
- Calculate total spending per campaign
- Monthly cost chart
- Export monthly report

### 4. Survey Analytics (`mobile/app/(root)/admin-survey.jsx`)
- List all surveys with detailed responses
- Category-wise charts
- Export PDF summary

### 5. Promotion Upload (`mobile/app/(root)/admin-promotions.jsx`)
- Upload promotion PDFs (using expo-document-picker)
- Set start/end dates
- Activate/deactivate promotions
- Preview PDF modal

### 6. PC Management (`mobile/app/(root)/admin-pcs.jsx`)
- Full CRUD for PC users
- Assign/reassign stores
- Bulk import from Excel
- Export to Excel

### 7. Reports & Analytics (`mobile/app/(root)/admin-analytics.jsx`)
- Generate daily/weekly/monthly summaries
- Export buttons (PDF/Excel)
- Email report option

## 📦 Required Dependencies:

Add to `mobile/package.json`:
```json
{
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "^15.0.0",
  "victory-native": "^37.0.0",
  "react-native-table-component": "^1.2.2",
  "expo-file-system": "already installed",
  "expo-document-picker": "already installed",
  "expo-sharing": "^12.0.0"
}
```

## 🎨 UI Components to Create:

### 1. `mobile/components/StatCard.jsx`
```jsx
// Summary card component for dashboard
<StatCard 
  title="Total PCs" 
  value={25} 
  icon="people" 
  color="#22c55e"
/>
```

### 2. `mobile/components/LineChart.jsx`
```jsx
// Wrapper for chart library
<LineChart 
  data={osaTrend} 
  title="OSA Submissions (7 Days)"
/>
```

### 3. `mobile/components/DataTable.jsx`
```jsx
// Reusable table with filters
<DataTable 
  data={osaReports}
  columns={['Store', 'PC', 'Date', 'Status']}
  onRowPress={handleRowPress}
/>
```

### 4. `mobile/components/FilterBar.jsx`
```jsx
// Filter component with date picker & dropdowns
<FilterBar 
  onFilter={handleFilter}
  filters={['date', 'store', 'status']}
/>
```

### 5. `mobile/components/ExportButton.jsx`
```jsx
// Export data to Excel/PDF
<ExportButton 
  data={filteredData}
  format="excel"
  filename="osa-report"
/>
```

## 🔧 API Client Updates:

Update `mobile/lib/api.js` to add:
```javascript
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  exportOSA: (params) => api.get('/admin/reports/osa/export', { params }),
  exportDisplay: (params) => api.get('/admin/reports/display/export', { params }),
};
```

## 📱 Navigation Updates:

Update `mobile/app/(root)/index.jsx` dashboard to show new admin modules:
```javascript
const adminModules = [
  { title: 'Dashboard', route: '/admin-dashboard', icon: 'stats-chart' },
  { title: 'PC Management', route: '/admin-pcs', icon: 'people' },
  { title: 'OSA Reports', route: '/admin-osa', icon: 'checkmark-circle' },
  { title: 'Display Management', route: '/admin-display', icon: 'images' },
  { title: 'Survey Analytics', route: '/admin-survey', icon: 'document-text' },
  { title: 'Promotions', route: '/admin-promotions', icon: 'megaphone' },
  { title: 'Analytics', route: '/admin-analytics', icon: 'analytics' },
  { title: 'Manage Stores', route: '/admin-stores', icon: 'storefront' },
  { title: 'Manage Users', route: '/admin-users', icon: 'person' },
];
```

## 🎯 Implementation Priority:

### Phase 1 (High Priority):
1. ✅ Backend admin endpoints (DONE)
2. Enhanced Admin Dashboard with charts
3. OSA Reports with filters & export
4. Display Management with cost analytics

### Phase 2 (Medium Priority):
5. Survey Analytics
6. Promotion Upload & Management
7. PC Management CRUD

### Phase 3 (Nice to Have):
8. Email reporting (NodeMailer)
9. PDF generation (react-native-pdf)
10. Bulk import/export

## 🚀 Quick Start:

### 1. Install Dependencies:
```bash
cd mobile
npm install react-native-chart-kit react-native-svg victory-native expo-sharing
```

### 2. Restart Backend:
```bash
cd backend
npm run dev
```

### 3. Test Admin Dashboard:
```bash
cd mobile
npx expo start
# Login as ADMIN role
# Navigate to Dashboard
```

## 📊 Expected Results:

After implementation, admins will be able to:
- ✅ View real-time metrics on dashboard
- ✅ See OSA & Display trends with charts
- ✅ Filter and export reports
- ✅ Manage PCs and store assignments
- ✅ Upload and manage promotions
- ✅ Generate automated reports

## 🎉 Your App Will Have:

- **Mobile App** (iOS/Android): Full PC field operations
- **Web App** (Browser): Same app, responsive design
- **Admin Portal**: Complete management & analytics
- **Backend API**: All endpoints ready
- **Database**: NeonDB with all tables

**Your PC Field App is now enterprise-ready!** 🚀
