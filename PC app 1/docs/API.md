# API Documentation

## 📡 Base URL

```
Development: http://localhost:5001/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

ทุก API endpoint (ยกเว้น `/health`) ต้องการ JWT token จาก Clerk

### Request Headers
```http
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

### Token Refresh
- Token มีอายุ 60 นาที
- Mobile app จะ auto-refresh ทุก 25 นาที
- หาก token หมดอายุ จะได้รับ status `401 Unauthorized`

## 📋 Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "error": { ... } // (development only)
}
```

### HTTP Status Codes
- `200` - OK (Success)
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Invalid/missing token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error

---

## 🏥 Health Check

### Check Server Status
```http
GET /health
```

**Response**
```json
{
  "status": "ok",
  "app": "PC Field App API",
  "timestamp": "2025-01-10T08:30:00.000Z"
}
```

---

## 👤 Users API

### Create or Update User
```http
POST /users
```

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "PC",
  "clerk_id": "user_xxxxxxxxxxxxx"
}
```

**Response** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "PC",
  "clerk_id": "user_xxxxxxxxxxxxx",
  "created_at": "2025-01-10T08:30:00.000Z",
  "updated_at": "2025-01-10T08:30:00.000Z"
}
```

### Get User by Clerk ID
```http
GET /users/clerk/:clerk_id
```

**Response** `200 OK`
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "PC",
  "clerk_id": "user_xxxxxxxxxxxxx"
}
```

### Get All Users
```http
GET /users?role=PC
```

**Query Parameters**
- `role` (optional) - Filter by role: `PC`, `MC`, `Admin`

**Response** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "PC User 1",
    "role": "PC",
    "assigned_stores": [
      {
        "id": "uuid",
        "store_name": "Store A",
        "store_code": "ST001"
      }
    ]
  }
]
```

### Update User Role
```http
PATCH /users/:id/role
```

**Request Body**
```json
{
  "role": "MC"
}
```

**Roles**: `PC`, `MC`, `Admin`

**Response** `200 OK`

### Delete User
```http
DELETE /users/:id
```

**Response** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

---

## 🏪 Stores API

### Get All Stores
```http
GET /stores?assigned_pc_id=uuid
```

**Query Parameters**
- `assigned_pc_id` (optional) - Filter by assigned PC

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "stores": [
      {
        "id": "uuid",
        "store_name": "Big C Rama 4",
        "store_code": "BC-R4-001",
        "store_type": "Hypermarket",
        "location": {
          "latitude": 13.7563,
          "longitude": 100.5018
        },
        "address": "123 Rama 4 Road",
        "phone": "02-xxx-xxxx",
        "assigned_pc_id": "uuid",
        "assigned_pc_name": "John Doe"
      }
    ]
  }
}
```

### Get Store by ID
```http
GET /stores/:id
```

**Response** `200 OK`

### Create Store
```http
POST /stores
```

**Request Body**
```json
{
  "store_name": "Tesco Lotus Sukhumvit",
  "store_code": "TL-SK-001",
  "store_type": "Hypermarket",
  "location": {
    "latitude": 13.7563,
    "longitude": 100.5018
  },
  "address": "456 Sukhumvit Road",
  "phone": "02-xxx-xxxx",
  "assigned_pc_id": "uuid"
}
```

**Response** `201 Created`

### Update Store
```http
PATCH /stores/:id
```

**Request Body** (partial update)
```json
{
  "phone": "02-xxx-xxxx",
  "assigned_pc_id": "new-uuid"
}
```

**Response** `200 OK`

### Delete Store
```http
DELETE /stores/:id
```

**Response** `200 OK`

---

## 📍 Store Visits API (Check-in System)

### Check In
```http
POST /store-visits/check-in
```

**Request Body**
```json
{
  "store_id": "uuid",
  "location": {
    "latitude": 13.7563,
    "longitude": 100.5018
  }
}
```

**Validation**
- ตรวจสอบระยะห่างจากร้าน (max 100m)
- ตรวจสอบว่ามีงานที่ร้านนี้หรือไม่
- ตรวจสอบว่ายังไม่ได้เช็คอินอยู่

**Response** `201 Created`
```json
{
  "status": "success",
  "data": {
    "visit": {
      "id": "uuid",
      "store_id": "uuid",
      "user_id": "uuid",
      "check_in_time": "2025-01-10T09:00:00.000Z",
      "check_in_location": {
        "latitude": 13.7563,
        "longitude": 100.5018
      },
      "status": "CHECKED_IN"
    }
  },
  "message": "Checked in successfully"
}
```

### Check Out
```http
POST /store-visits/check-out
```

**Request Body**
```json
{
  "visit_id": "uuid",
  "location": {
    "latitude": 13.7563,
    "longitude": 100.5018
  }
}
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "visit": {
      "id": "uuid",
      "check_in_time": "2025-01-10T09:00:00.000Z",
      "check_out_time": "2025-01-10T17:00:00.000Z",
      "duration_minutes": 480,
      "status": "COMPLETED"
    }
  },
  "message": "Checked out successfully"
}
```

### Cancel Check-in
```http
POST /store-visits/cancel-check-in
```

**Request Body**
```json
{
  "visit_id": "uuid"
}
```

**Response** `200 OK`

### Get Current Check-in
```http
GET /store-visits/current
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "currentVisit": {
      "id": "uuid",
      "store_id": "uuid",
      "store_name": "Big C Rama 4",
      "check_in_time": "2025-01-10T09:00:00.000Z",
      "status": "CHECKED_IN"
    }
  }
}
```

### Get Visit History
```http
GET /store-visits/history?from=2025-01-01&to=2025-01-31
```

**Query Parameters**
- `from` (optional) - Start date (YYYY-MM-DD)
- `to` (optional) - End date (YYYY-MM-DD)
- `store_id` (optional) - Filter by store

**Response** `200 OK`

### Validate Access
```http
GET /store-visits/validate-access?store_id=uuid
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "canCheckIn": true,
    "distance": 45.6,
    "hasActiveTasks": true
  }
}
```

---

## 📋 Task Management API

### PC: Get Check-in Eligibility
```http
GET /pc/checkin-eligibility
```

**Description**: ดึงรายการร้านที่ PC สามารถเช็คอินได้ (มีงานวันนี้)

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "date": "2025-01-10",
    "eligibleStores": [
      {
        "storeId": "uuid",
        "storeName": "Big C Rama 4",
        "storeCode": "BC-R4-001",
        "location": {
          "latitude": 13.7563,
          "longitude": 100.5018
        },
        "tasks": [
          {
            "id": "uuid",
            "type": "OSA",
            "title": "Check product availability",
            "status": "ASSIGNED",
            "taskDate": "2025-01-10"
          }
        ]
      }
    ],
    "totalStores": 1,
    "totalTasks": 1
  }
}
```

### PC: Get Dashboard
```http
GET /pc/dashboard
```

**Description**: Dashboard ของ PC แสดงงานทั้งหมดแบ่งตามสถานะ

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "assigned": [ ... ],
    "inProgress": [ ... ],
    "submitted": [ ... ],
    "completed": [ ... ]
  }
}
```

### PC: Get Task Details
```http
GET /tasks/:id
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "task": {
      "id": "uuid",
      "type": "OSA",
      "title": "Check product availability",
      "description": "Check all products on shelf",
      "store_id": "uuid",
      "store_name": "Big C Rama 4",
      "task_date": "2025-01-10",
      "due_date": "2025-01-10",
      "priority": "HIGH",
      "status": "ASSIGNED",
      "attachments": [],
      "assigned_by_mc_name": "Supervisor Name"
    }
  }
}
```

### PC: Update Task Status
```http
PATCH /tasks/:id/status
```

**Request Body**
```json
{
  "status": "IN_PROGRESS"
}
```

**PC สามารถเปลี่ยนเป็น**: `IN_PROGRESS`, `SUBMITTED`, `COMPLETED`

**Response** `200 OK`

### MC: Create Task Batch
```http
POST /task-batches
```

**Request Body**
```json
{
  "assignedToPcId": "uuid",
  "storeId": "uuid",
  "note": "Please complete today",
  "tasks": [
    {
      "type": "OSA",
      "title": "Check product availability",
      "description": "Check all products on shelf",
      "taskDate": "2025-01-10",
      "dueDate": "2025-01-10",
      "priority": "HIGH"
    },
    {
      "type": "SPECIAL_DISPLAY",
      "title": "Setup endcap display",
      "taskDate": "2025-01-10"
    }
  ]
}
```

**Task Types**: `OSA`, `SPECIAL_DISPLAY`, `SURVEY`, `PROMOTION`

**Priority**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

**Response** `201 Created`
```json
{
  "status": "success",
  "data": {
    "batch": {
      "id": "uuid",
      "batch_name": "Task Batch 1/10/2025",
      "assigned_to_pc_id": "uuid",
      "store_id": "uuid",
      "status": "ACTIVE"
    },
    "tasks": [ ... ]
  },
  "message": "Task batch created successfully"
}
```

### MC: Get My Batches
```http
GET /task-batches
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "batches": [
      {
        "id": "uuid",
        "batch_name": "Task Batch 1/10/2025",
        "pc_name": "John Doe",
        "pc_email": "john@example.com",
        "task_count": 3,
        "status": "ACTIVE",
        "created_at": "2025-01-10T08:00:00.000Z"
      }
    ]
  }
}
```

### MC: Get Batch Details
```http
GET /task-batches/:id
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "batch": { ... },
    "tasks": [ ... ]
  }
}
```

---

## 📊 OSA API

### Create OSA Record
```http
POST /osa
Content-Type: multipart/form-data
```

**Request Body (Form Data)**
```
store_id: uuid
osa_date: 2025-01-10
osa_status: IN_STOCK
notes: All products available
photos: [File, File, ...]
```

**OSA Status**: `IN_STOCK`, `OUT_OF_STOCK`, `LOW_STOCK`

**Response** `201 Created`

### Get OSA Records
```http
GET /osa?store_id=uuid&from=2025-01-01&to=2025-01-31
```

**Query Parameters**
- `store_id` (optional)
- `from` (optional) - Start date
- `to` (optional) - End date
- `status` (optional) - Filter by status

**Response** `200 OK`

### Get OSA by ID
```http
GET /osa/:id
```

**Response** `200 OK`

### Delete OSA
```http
DELETE /osa/:id
```

**Response** `200 OK`

---

## 🖼️ Display API

### Create Display Record
```http
POST /displays
Content-Type: multipart/form-data
```

**Request Body (Form Data)**
```
store_id: uuid
display_type: ENDCAP
location: Front entrance
display_date: 2025-01-10
notes: Promotional display for new product
photos: [File, File, ...]
```

**Display Types**: `ENDCAP`, `SHELF_TALKER`, `FLOOR_DISPLAY`, `HANGING`, `OTHER`

**Response** `201 Created`

### Get Displays
```http
GET /displays?store_id=uuid
```

**Response** `200 OK`

### Verify Display
```http
PATCH /displays/:id/verify
```

**Response** `200 OK`

### Delete Display
```http
DELETE /displays/:id
```

**Response** `200 OK`

---

## 📋 Survey API

### Create Survey Record
```http
POST /surveys
Content-Type: multipart/form-data
```

**Request Body (Form Data)**
```
store_id: uuid
survey_type: CUSTOMER_SATISFACTION
survey_date: 2025-01-10
survey_data: {"question1": "answer1", ...}
notes: Survey completed
photos: [File, ...]
```

**Response** `201 Created`

### Get Surveys
```http
GET /surveys?store_id=uuid
```

**Response** `200 OK`

### Get Survey by ID
```http
GET /surveys/:id
```

**Response** `200 OK`

### Delete Survey
```http
DELETE /surveys/:id
```

**Response** `200 OK`

---

## 🎁 Promotions API

### Create Promotion
```http
POST /promotions
Content-Type: multipart/form-data
```

**Request Body (Form Data)**
```
title: New Year Sale
description: 50% discount on all items
start_date: 2025-01-01
end_date: 2025-01-31
active: true
photos: [File, ...]
```

**Response** `201 Created`

### Get Promotions
```http
GET /promotions?active=true
```

**Query Parameters**
- `active` (optional) - Filter by active status

**Response** `200 OK`

### Get Promotion by ID
```http
GET /promotions/:id
```

**Response** `200 OK`

### Delete Promotion
```http
DELETE /promotions/:id
```

**Response** `200 OK`

---

## ✅ Approvals API

### Get Pending Approvals
```http
GET /approvals/pending?type=OSA
```

**Query Parameters**
- `type` (optional) - `OSA`, `DISPLAY`, `SURVEY`

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "pending": [
      {
        "id": "uuid",
        "type": "OSA",
        "store_name": "Big C Rama 4",
        "pc_name": "John Doe",
        "created_at": "2025-01-10T10:00:00.000Z",
        "status": "PENDING"
      }
    ]
  }
}
```

### Approve OSA
```http
POST /approvals/osa/:id/approve
```

**Response** `200 OK`

### Reject OSA
```http
POST /approvals/osa/:id/reject
```

**Request Body**
```json
{
  "reason": "Photos are not clear"
}
```

**Response** `200 OK`

### Approve Display
```http
POST /approvals/display/:id/approve
```

**Response** `200 OK`

### Reject Display
```http
POST /approvals/display/:id/reject
```

**Request Body**
```json
{
  "reason": "Display not as requested"
}
```

**Response** `200 OK`

### Approve Survey
```http
POST /approvals/survey/:id/approve
```

**Response** `200 OK`

### Reject Survey
```http
POST /approvals/survey/:id/reject
```

**Request Body**
```json
{
  "reason": "Incomplete survey"
}
```

**Response** `200 OK`

### Get Rejected Items
```http
GET /approvals/rejected
```

**Response** `200 OK`

### Get Approval Stats
```http
GET /approvals/stats?from=2025-01-01&to=2025-01-31
```

**Response** `200 OK`
```json
{
  "status": "success",
  "data": {
    "stats": {
      "total": 100,
      "approved": 85,
      "rejected": 10,
      "pending": 5,
      "approvalRate": 85
    }
  }
}
```

---

## 👨‍💼 Admin API

### Get All Users (Admin)
```http
GET /admin/users
```

**Response** `200 OK`

### Get All Stores (Admin)
```http
GET /admin/stores
```

**Response** `200 OK`

### Get Reports
```http
GET /admin/reports?from=2025-01-01&to=2025-01-31
```

**Response** `200 OK`

---

## ⚠️ Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Response**: `429 Too Many Requests`

```json
{
  "message": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

---

## 🔄 Webhooks (Future)

Coming soon...

---

## 📝 Notes

1. ทุก timestamp ใช้ format ISO 8601 (UTC)
2. ทุก date ใช้ format YYYY-MM-DD
3. File upload จำกัด 10MB per file
4. รูปภาพรองรับ: JPG, PNG, WEBP
5. Timezone calculations ใช้ Asia/Bangkok

---

**API Version**: 1.0  
**Last Updated**: November 2025
