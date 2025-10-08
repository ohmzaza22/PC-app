# Edit Store Feature - Implementation Summary

## ✅ What Was Added

### **Edit Store Functionality**
You can now **edit existing stores** in addition to adding new ones!

## 📁 Files Created/Modified

### 1. **Created: `/mobile/app/(root)/edit-store.jsx`**
- **Unified page** for both adding AND editing stores
- Automatically detects if it's in edit mode (when `id` parameter is present)
- Loads existing store data when editing
- Pre-fills all fields including map marker position
- Updates store via API when in edit mode
- Creates new store when no ID is provided

### 2. **Updated: `/mobile/app/(root)/admin-stores.jsx`**
- Added **Edit button** (pencil icon) next to each store
- Edit button navigates to `/edit-store?id={storeId}`
- Updated "Add Store with Map" button to use `/edit-store`
- Clean interface with edit and delete actions

### 3. **Updated: `/mobile/app/(root)/add-store.jsx`**
- Now redirects to `/edit-store` for consistency
- Maintains backward compatibility

## 🎯 Features

### **When Adding a New Store:**
- Empty form
- Auto-generate store code option enabled
- Default map location (Bangkok)
- Button says "Save Store"

### **When Editing an Existing Store:**
- All fields pre-filled with existing data
- Map marker shows current store location
- Map automatically centers on store location
- Store code field is editable (no auto-generate)
- Button says "Update Store"
- Draggable marker to reposition store

### **Common Features:**
- ✅ Form validation
- ✅ Interactive map with tap-to-place marker
- ✅ "Use Current Location" button
- ✅ Reverse geocoding for addresses
- ✅ Draggable markers
- ✅ Real-time lat/lng display
- ✅ Success/error handling
- ✅ Loading states

## 🚀 How to Use

### **To Add a New Store:**
1. Go to: **Admin → Manage Stores**
2. Tap: **"Add Store with Map"** button
3. Fill in details and place marker
4. Tap: **"Save Store"**

### **To Edit an Existing Store:**
1. Go to: **Admin → Manage Stores**
2. Find the store you want to edit
3. Tap the **pencil icon** (✏️) next to the store
4. Modify any details
5. Drag marker to reposition if needed
6. Tap: **"Update Store"**

### **To Delete a Store:**
1. Go to: **Admin → Manage Stores**
2. Tap the **trash icon** (🗑️) next to the store
3. Confirm deletion

## 🔧 Technical Details

### **Route Parameters**
- `/edit-store` - Add new store (no parameters)
- `/edit-store?id=123` - Edit store with ID 123

### **API Endpoints Used**
- `GET /api/stores/:id` - Load store details
- `POST /api/stores` - Create new store
- `PATCH /api/stores/:id` - Update existing store
- `DELETE /api/stores/:id` - Delete store

### **Data Flow**
1. **Edit Mode Detection**: Checks for `id` in route params
2. **Load Data**: Fetches store details via API
3. **Parse Location**: Handles both string and object location data
4. **Pre-fill Form**: Sets all state variables
5. **Position Map**: Centers map on store coordinates
6. **Save/Update**: Calls appropriate API endpoint

### **Location Data Handling**
```javascript
// Handles both formats:
location: {
  address: "123 Main St",
  province: "Bangkok",
  latitude: 13.7563,
  longitude: 100.5018
}
```

## 🎨 UI Enhancements

### **Store List Item:**
```
[Store Icon] Store Name          [✏️ Edit] [🗑️ Delete]
             Assigned to: PC Name
```

### **Edit Store Header:**
- Shows "Add New Store" when adding
- Shows "Edit Store" when editing

### **Map Marker:**
- Draggable in both add and edit modes
- Shows store name as title
- Shows address as description

## 📝 Notes

- Store code cannot be auto-generated when editing (to prevent accidental changes)
- All existing data is preserved when updating
- Map automatically animates to store location when editing
- Validation ensures required fields are filled
- Back button returns to store list
- Changes are saved to database immediately

## ✨ Benefits

1. **No data loss** - Edit without recreating stores
2. **Easy repositioning** - Drag marker to update location
3. **Unified interface** - Same page for add/edit
4. **Better UX** - Pre-filled forms save time
5. **Visual feedback** - See store location on map immediately
