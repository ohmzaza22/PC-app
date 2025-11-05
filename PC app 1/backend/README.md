# Backend API Documentation

## 📋 Overview

Backend API สำหรับ PC Field App สร้างด้วย Node.js, Express และ PostgreSQL รองรับการจัดการงานภาคสนาม การ authentication, file upload และระบบ rate limiting

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   API Gateway                       │
│              (Express + Middleware)                 │
└──┬──────────────────────────────────────────────┬───┘
   │                                              │
   ▼                                              ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────┐
│ Clerk Auth   │  │ Rate Limiter   │  │  CORS        │
│ Middleware   │  │ (Upstash)      │  │  Middleware  │
└──────────────┘  └────────────────┘  └──────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────┐
│                   Controllers                       │
│  • Users  • Stores  • Tasks  • OSA  • Display      │
│  • Survey • Promotions • Approvals • Admin         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                │
│         Neon Serverless PostgreSQL                  │
└─────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.js           # Database connection & migrations
│   │   ├── cron.js         # Scheduled jobs
│   │   └── upstash.js      # Redis configuration
│   │
│   ├── controllers/         # Business logic
│   │   ├── userController.js
│   │   ├── storeController.js
│   │   ├── taskController.js
│   │   ├── taskBatchController.js
│   │   ├── osaController.js
│   │   ├── displayController.js
│   │   ├── surveyController.js
│   │   ├── promotionController.js
│   │   ├── approvalController.js
│   │   ├── storeVisitController.js
│   │   └── adminController.js
│   │
│   ├── middleware/          # Middleware functions
│   │   ├── clerkAuth.js    # Authentication & authorization
│   │   ├── rateLimiter.js  # Rate limiting
│   │   └── roleMiddleware.js # Role-based access control
│   │
│   ├── routes/             # API routes
│   │   ├── userRoute.js
│   │   ├── storeRoute.js
│   │   ├── taskRoute.js
│   │   ├── osaRoute.js
│   │   ├── displayRoute.js
│   │   ├── surveyRoute.js
│   │   ├── promotionRoute.js
│   │   ├── approvalRoute.js
│   │   ├── storeVisitRoute.js
│   │   └── adminRoute.js
│   │
│   ├── utils/              # Utility functions
│   │   ├── errors.js       # Custom error classes
│   │   ├── helpers.js      # Helper functions
│   │   ├── response.js     # Standardized API responses
│   │   ├── upload.js       # Cloudinary upload
│   │   └── upload-local.js # Local file upload
│   │
│   ├── migrations/         # Database migrations
│   │   ├── enhance-schema.js
│   │   ├── add-task-assignments.js
│   │   └── add-store-fields.js
│   │
│   ├── scripts/            # Utility scripts
│   │   ├── run-migrations.js
│   │   ├── check-users.js
│   │   └── update-user-role.js
│   │
│   └── server.js           # Application entry point
│
├── .env.example            # Environment variables template
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Tables Overview

1. **users** - ข้อมูลผู้ใช้งาน
2. **stores** - ข้อมูลร้านค้า
3. **store_visits** - บันทึกการเข้า-ออกร้าน (Check-in/Check-out)
4. **task_batches** - กลุ่มงานที่มอบหมาย
5. **tasks** - งานแต่ละรายการ
6. **osa_records** - บันทึก OSA
7. **display_records** - บันทึก Display
8. **survey_records** - บันทึก Survey
9. **promotion_records** - บันทึก Promotion

### Key Relationships

```sql
users 1──N stores (assigned_pc_id)
users 1──N task_batches (assigned_by_mc_id, assigned_to_pc_id)
task_batches 1──N tasks
stores 1──N store_visits
users 1──N osa_records
users 1──N display_records
users 1──N survey_records
```

## 🔌 API Endpoints

### Authentication
- ทุก endpoint (ยกเว้น `/api/health`) ต้องมี JWT token ใน Authorization header
- Format: `Authorization: Bearer <token>`

### Health Check
```
GET /api/health
```

### Users
```
POST   /api/users                    # สร้าง/อัพเดทผู้ใช้
GET    /api/users/clerk/:clerk_id    # ดึงข้อมูลผู้ใช้จาก Clerk ID
GET    /api/users?role=PC            # ดึงรายชื่อผู้ใช้ (filter by role)
PATCH  /api/users/:id/role           # อัพเดทบทบาท
DELETE /api/users/:id                # ลบผู้ใช้
```

### Stores
```
GET    /api/stores                   # ดึงรายชื่อร้านค้า
GET    /api/stores/:id               # ดึงข้อมูลร้านเฉพาะ
POST   /api/stores                   # สร้างร้านใหม่
PATCH  /api/stores/:id               # อัพเดทข้อมูลร้าน
DELETE /api/stores/:id               # ลบร้าน
```

### Store Visits (Check-in System)
```
POST   /api/store-visits/check-in         # เช็คอิน
POST   /api/store-visits/check-out        # เช็คเอาท์
POST   /api/store-visits/cancel-check-in  # ยกเลิกการเช็คอิน
GET    /api/store-visits/current          # ดึงข้อมูลการเช็คอินปัจจุบัน
GET    /api/store-visits/history          # ประวัติการเข้าร้าน
GET    /api/store-visits/validate-access  # ตรวจสอบสิทธิ์เข้าร้าน
```

### Task Management

#### PC Endpoints
```
GET    /api/pc/checkin-eligibility   # ดึงร้านที่มีงานวันนี้
GET    /api/pc/dashboard             # Dashboard ของ PC
PATCH  /api/tasks/:id/status         # อัพเดทสถานะงาน
GET    /api/tasks/:id                # ดึงรายละเอียดงาน
```

#### MC Endpoints
```
POST   /api/task-batches             # สร้าง Task Batch
GET    /api/task-batches             # ดึงรายการ Batches
GET    /api/task-batches/:id         # รายละเอียด Batch
```

### OSA (On-Shelf Availability)
```
POST   /api/osa                      # บันทึก OSA
GET    /api/osa                      # ดึงรายการ OSA
GET    /api/osa/:id                  # รายละเอียด OSA
DELETE /api/osa/:id                  # ลบ OSA
```

### Display
```
POST   /api/displays                 # บันทึก Display
GET    /api/displays                 # ดึงรายการ Display
PATCH  /api/displays/:id/verify      # Verify Display
DELETE /api/displays/:id             # ลบ Display
```

### Survey
```
POST   /api/surveys                  # บันทึก Survey
GET    /api/surveys                  # ดึงรายการ Survey
GET    /api/surveys/:id              # รายละเอียด Survey
DELETE /api/surveys/:id              # ลบ Survey
```

### Promotions
```
POST   /api/promotions               # สร้าง Promotion
GET    /api/promotions               # ดึงรายการ Promotion
GET    /api/promotions/:id           # รายละเอียด Promotion
DELETE /api/promotions/:id           # ลบ Promotion
```

### Approvals
```
GET    /api/approvals/pending        # งานที่รออนุมัติ
GET    /api/approvals/rejected       # งานที่ถูกปฏิเสธ
GET    /api/approvals/stats          # สถิติการอนุมัติ

# OSA Approval
POST   /api/approvals/osa/:id/approve
POST   /api/approvals/osa/:id/reject

# Display Approval
POST   /api/approvals/display/:id/approve
POST   /api/approvals/display/:id/reject

# Survey Approval
POST   /api/approvals/survey/:id/approve
POST   /api/approvals/survey/:id/reject
```

### Admin
```
GET    /api/admin/users              # รายชื่อผู้ใช้ทั้งหมด
GET    /api/admin/stores             # รายชื่อร้านทั้งหมด
GET    /api/admin/reports            # รายงานสรุป
```

## 🔒 Authentication & Authorization

### Clerk Authentication
- ใช้ Clerk สำหรับ authentication
- ตรวจสอบ JWT token ผ่าน `verifyClerkToken` middleware
- Token จะถูกส่งมาใน Authorization header

### Role-Based Access Control
```javascript
// สิทธิ์แบ่งตาม role
PC         - พนักงานภาคสนาม (ทำงานที่ร้าน)
MC         - Supervisor (มอบหมายงาน อนุมัติงาน)
Admin      - ผู้ดูแลระบบ (จัดการทุกอย่าง)
```

### Middleware Chain Example
```javascript
router.post(
  '/task-batches',
  verifyClerkToken,           // ตรวจสอบ JWT token
  requireRole('MC', 'Admin'), // ต้องเป็น MC หรือ Admin เท่านั้น
  createTaskBatch             // Controller function
);
```

## 📤 File Upload

### Cloudinary Integration
- รองรับการอัพโหลดรูปภาพผ่าน Cloudinary
- Middleware: `upload.array('photos', 10)`
- ประเภทไฟล์: jpg, jpeg, png, webp
- ขนาดไฟล์สูงสุด: 10MB

### Upload Flow
```javascript
// Controller example
export async function createOSA(req, res) {
  const photos = req.files.map(file => file.path); // Cloudinary URLs
  // ... บันทึกลง database
}
```

## ⚡ Rate Limiting

### Upstash Redis
- จำกัดจำนวน requests ต่อ IP address
- Default: 100 requests ต่อ 15 นาที
- ป้องกัน abuse และ DDoS attacks

### Configuration
```javascript
// src/middleware/rateLimiter.js
export const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "15 m"),
  analytics: true,
});
```

## ⏰ Cron Jobs

### Scheduled Tasks
```javascript
// src/config/cron.js
const job = new CronJob(
  '0 0 * * *',  // ทุกเที่ยงคืน
  async () => {
    // Clean up old data
    // Send reminders
    // Generate reports
  },
  null,
  false,
  'Asia/Bangkok'
);
```

## 🛠️ Utilities

### Response Helpers
```javascript
import { 
  sendSuccess,      // 200 OK
  sendCreated,      // 201 Created
  sendError,        // 500 Error
  sendNotFound,     // 404 Not Found
  sendForbidden,    // 403 Forbidden
  sendValidationError // 400 Bad Request
} from '../utils/response.js';

// Usage
sendSuccess(res, data, 'Success message');
sendCreated(res, data, 'Resource created');
sendError(res, 'Error message');
```

### Custom Errors
```javascript
import { 
  ValidationError,
  NotFoundError,
  ForbiddenError 
} from '../utils/errors.js';

// Usage
throw new ValidationError('Invalid input');
throw new NotFoundError('Resource not found');
throw new ForbiddenError('Access denied');
```

### Helper Functions
```javascript
import { getUserIdFromClerkId } from '../utils/helpers.js';

// แปลง Clerk ID เป็น Database User ID
const userId = await getUserIdFromClerkId(sql, req.userId);
```

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:5001/api/health

# Create user (with auth token)
curl -X POST http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","role":"PC"}'
```

### Database Testing Scripts
```bash
# Check tables
node check-tables.js

# Check users
node src/scripts/check-users.js

# Update user role
node src/scripts/update-user-role.js
```

## 🚀 Deployment

### Environment Setup
```env
DATABASE_URL=postgresql://user:pass@host/db
CLERK_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
PORT=5001
NODE_ENV=production
```

### Production Start
```bash
npm run db:migrate  # Run migrations
npm start           # Start server
```

## 📊 Monitoring & Logging

### Console Logs
```javascript
console.log('✅ Success:', message);
console.log('❌ Error:', error);
console.log('📍 Info:', info);
console.log('⚠️  Warning:', warning);
```

### Error Handling
```javascript
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});
```

## 🔧 Development Tips

### Nodemon for Auto-Restart
```bash
npm run dev  # Auto-restart on file changes
```

### Database Migrations
```bash
# Run all migrations
npm run db:migrate

# Create new migration
# Add .js file in src/migrations/
```

### Code Style
- ใช้ ES6 modules (`import/export`)
- Async/await สำหรับ asynchronous operations
- Try-catch สำหรับ error handling
- JSDoc comments สำหรับ functions

## 📝 Best Practices

1. **Always validate input** - ตรวจสอบข้อมูลก่อนบันทึก
2. **Use transactions** - สำหรับ operations ที่ต้องการ atomicity
3. **Handle errors properly** - Try-catch และ error middleware
4. **Log important events** - ช่วยใน debugging
5. **Secure sensitive data** - อย่า log passwords หรือ tokens
6. **Use prepared statements** - ป้องกัน SQL injection
7. **Rate limit endpoints** - ป้องกัน abuse

## 🐛 Common Issues

### Database Connection
```
Error: Database initialization failed
Solution: ตรวจสอบ DATABASE_URL ใน .env
```

### Clerk Authentication
```
Error: Unauthorized - Invalid token
Solution: ตรวจสอบ CLERK_SECRET_KEY และ token expiration
```

### File Upload
```
Error: Cloudinary upload failed
Solution: ตรวจสอบ Cloudinary credentials
```

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ logs ใน console
2. ดู error message และ stack trace
3. ตรวจสอบ environment variables
4. ทดสอบด้วย curl หรือ Postman

---

**Updated**: November 2025
