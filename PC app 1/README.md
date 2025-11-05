# PC Field App - ระบบจัดการงานภาคสนาม

## 📋 ภาพรวมของโปรเจกต์

PC Field App เป็นระบบจัดการงานภาคสนามแบบครบวงจร ออกแบบมาสำหรับการบริหารจัดการงานของพนักงานภาคสนาม (PC - Promoter Coordinator) โดยมีระบบการมอบหมายงาน ตรวจสอบ และอนุมัติงานจากผู้ดูแล (MC - Merchandiser Coordinator/Supervisor)

### 🎯 วัตถุประสงค์หลัก

1. **การจัดการงานภาคสนาม** - มอบหมาย ติดตาม และรายงานงานต่างๆ ในร้านค้า
2. **ระบบ Check-in/Check-out** - ตรวจสอบการเข้างานที่ร้านค้าด้วย GPS
3. **บันทึกข้อมูลงาน** - OSA (On-Shelf Availability), Display, Survey, Promotion
4. **การอนุมัติงาน** - ระบบตรวจสอบและอนุมัติงานจาก Supervisor
5. **รายงานและสถิติ** - Dashboard และรายงานสำหรับผู้บริหาร

### 👥 บทบาทผู้ใช้งาน

- **PC (Promoter Coordinator)** - พนักงานภาคสนาม ทำงานที่ร้านค้า
- **MC (Merchandiser Coordinator/Supervisor)** - ผู้ดูแล มอบหมายงานและอนุมัติผลงาน
- **Admin** - ผู้ดูแลระบบ จัดการผู้ใช้และข้อมูลหลัก

## 🏗️ สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)            │
│                      Expo + Clerk Auth                  │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API
                  │ (HTTP/JSON)
┌─────────────────▼───────────────────────────────────────┐
│              Backend API (Node.js/Express)              │
│              • Authentication (Clerk)                   │
│              • Rate Limiting (Upstash)                  │
│              • File Upload (Cloudinary)                 │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Database (NeonDB - PostgreSQL)             │
│              • Users & Stores                           │
│              • Tasks & Batches                          │
│              • OSA, Display, Survey, Promotion          │
└─────────────────────────────────────────────────────────┘
```

## 📁 โครงสร้างโปรเจกต์

```
PC-app/
├── backend/                    # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/            # การตั้งค่าระบบ (DB, Cron, Upstash)
│   │   ├── controllers/       # Business Logic แยกตาม Feature
│   │   ├── middleware/        # Authentication, Rate Limiting
│   │   ├── routes/           # API Routes
│   │   ├── utils/            # Helper Functions
│   │   ├── migrations/       # Database Migrations
│   │   └── server.js         # Entry Point
│   └── package.json
│
└── mobile/                    # Mobile App (React Native + Expo)
    ├── app/                  # Screens (Expo Router)
    │   ├── (auth)/          # Authentication Screens
    │   └── (root)/          # Main App Screens
    ├── components/          # Reusable Components
    ├── store/              # State Management (Zustand)
    ├── lib/                # API Client
    ├── utils/              # Helper Functions
    └── package.json
```

## 🚀 การติดตั้งและเริ่มใช้งาน

### ข้อกำหนดเบื้องต้น

- **Node.js** 18+ และ npm
- **PostgreSQL Database** (แนะนำ NeonDB)
- **Clerk Account** สำหรับ Authentication
- **Cloudinary Account** สำหรับจัดเก็บรูปภาพ
- **Upstash Redis** สำหรับ Rate Limiting

### 📦 ติดตั้ง Backend

```bash
cd backend

# ติดตั้ง dependencies
npm install

# ตั้งค่า environment variables
cp .env.example .env
# แก้ไขไฟล์ .env ให้ครบถ้วน

# รัน database migrations
npm run db:migrate

# เริ่มต้น development server
npm run dev
```

**Environment Variables สำหรับ Backend (.env)**

```env
# Database
DATABASE_URL=postgresql://...

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Server
PORT=5001
NODE_ENV=development
```

### 📱 ติดตั้ง Mobile App

```bash
cd mobile

# ติดตั้ง dependencies
npm install

# ตั้งค่า environment variables
cp .env.example .env
# แก้ไขไฟล์ .env ให้ครบถ้วน

# เริ่มต้น Expo development server
npm start

# รัน iOS (ต้องมี Xcode)
npm run ios

# รัน Android (ต้องมี Android Studio)
npm run android
```

**Environment Variables สำหรับ Mobile (.env)**

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

## 📚 เอกสารเพิ่มเติม

- [📖 Backend Documentation](./backend/README.md) - รายละเอียด Backend API
- [📱 Mobile Documentation](./mobile/README.md) - รายละเอียด Mobile App
- [🔌 API Documentation](./docs/API.md) - API Endpoints และการใช้งาน
- [🏗️ Architecture Guide](./docs/ARCHITECTURE.md) - สถาปัตยกรรมระบบโดยละเอียด
- [📋 Task System](./backend/README_TASK_SYSTEM.md) - ระบบมอบหมายงาน

## ✨ ฟีเจอร์หลัก

### 🏪 Store Management (จัดการร้านค้า)
- เพิ่ม/แก้ไข/ลบข้อมูลร้านค้า
- มอบหมายร้านให้กับ PC
- แสดงตำแหน่งร้านบนแผนที่

### 📍 Check-in System (ระบบเช็คอิน)
- เช็คอินด้วย GPS (ตรวจสอบระยะห่าง)
- บันทึกเวลาเข้า-ออกงาน
- แสดงประวัติการเข้างาน

### 📝 Task Management (จัดการงาน)
- **MC**: มอบหมายงานเป็น Batch ให้ PC
- **PC**: รับงาน อัพเดทสถานะงาน
- **Task Types**: OSA, SPECIAL_DISPLAY, SURVEY, PROMOTION

### 📊 OSA (On-Shelf Availability)
- บันทึกสถานะสินค้าบนชั้นวาง
- ถ่ายรูปหลักฐาน
- ระบุปัญหาที่พบ

### 🖼️ Special Display
- บันทึกการจัด Display พิเศษ
- ถ่ายรูปก่อน-หลัง
- ระบุประเภท Display

### 📋 Survey
- สำรวจข้อมูลตามแบบสอบถาม
- บันทึกคำตอบและรูปภาพ
- ส่งผลสำรวจให้ MC

### 🎁 Promotion Management
- บันทึกโปรโมชั่นในร้าน
- ติดตามระยะเวลาโปรโมชั่น
- แนบเอกสารและรูปภาพ

### ✅ Approval System (ระบบอนุมัติ)
- MC ตรวจสอบและอนุมัติงานของ PC
- ระบบแจ้งเตือนงานที่รออนุมัติ
- ประวัติการอนุมัติ/ปฏิเสธ

## 🔧 เทคโนโลยีที่ใช้

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (NeonDB)
- **Authentication**: Clerk
- **File Storage**: Cloudinary
- **Rate Limiting**: Upstash Redis
- **Cron Jobs**: node-cron

### Mobile
- **Framework**: React Native + Expo
- **Router**: Expo Router (File-based routing)
- **Authentication**: @clerk/clerk-expo
- **State Management**: Zustand
- **API Client**: Axios
- **Maps**: react-native-maps
- **Animations**: react-native-reanimated

## 🔐 Security Features

1. **Authentication**: JWT-based authentication ผ่าน Clerk
2. **Rate Limiting**: จำกัดจำนวน requests ป้องกัน abuse
3. **Role-Based Access Control**: ตรวจสอบสิทธิ์ตามบทบาท
4. **Input Validation**: ตรวจสอบข้อมูลก่อนบันทึก
5. **Secure File Upload**: จำกัดประเภทและขนาดไฟล์

## 📈 การพัฒนาต่อ

### Planned Features
- [ ] Push Notifications
- [ ] Offline Mode with Sync
- [ ] Advanced Analytics Dashboard
- [ ] Export Reports (PDF/Excel)
- [ ] Multi-language Support
- [ ] Dark Mode

## 🤝 การมีส่วนร่วม

หากพบปัญหาหรือต้องการเพิ่มฟีเจอร์ใหม่:
1. สร้าง Issue อธิบายปัญหาหรือฟีเจอร์
2. Fork repository
3. สร้าง Feature branch
4. Commit การเปลี่ยนแปลง
5. สร้าง Pull Request

## 📄 License

This project is proprietary and confidential.

## 👨‍💻 ผู้พัฒนา

Developed with ❤️ for PC Field Operations

---

**หมายเหตุ**: เอกสารนี้อัพเดทล่าสุด November 2025
