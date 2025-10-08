<h1 align="center">📱 PC Field App - Field Operations Management System 🚀</h1>

## 🎯 Overview

**PC Field App** is a production-ready mobile + backend system for in-store field staff (PCs) to record and report operational activities including:
- ✅ **On-Shelf Availability (OSA)** - Stock checks and availability tracking
- 📸 **Special Display** - Display setup recording with cost tracking
- 📋 **Market Surveys** - Field surveys and competitor analysis
- 📢 **Promotion Viewer** - View and access active promotions

---

## 🏗️ Tech Stack

### Frontend (Mobile)
- **React Native** with Expo SDK ~53
- **Expo Router** for navigation
- **Zustand** for state management
- **AsyncStorage** for offline caching
- **Clerk** for authentication
- **Axios** for API requests
- **Expo Image Picker** & **Location** for field operations

### Backend (Server)
- **Node.js** + **Express**
- **NeonDB** (PostgreSQL)
- **Clerk** JWT validation middleware
- **Cloudinary** for photo uploads
- **Upstash Redis** for rate limiting
- **Multer** for file handling

---

## 👥 User Roles

| Role | Description | Access Permissions |
|------|-------------|-------------------|
| **PC (Promoter)** | Performs OSA, Display, and Survey tasks in-store | Can check-in/out, submit photos and data |
| **MC / Supervisor** | Oversees PC performance and task submissions | View/approve submissions, verify locations |
| **Admin** | Manages data, users, and exports reports | Full CRUD access |
| **Sales / Trade Marketing / Vendor** | Uploads promotion PDFs, views analytics | Upload + read promotions |

---

## 📱 Mobile App Features

### Main Dashboard (4 Modules)
1. **On-Shelf Availability (OSA)** - Check-in, photo upload, stock checklist
2. **Special Display** - Capture display photos with cost breakdown
3. **Market Information (Survey)** - Fill survey forms with photos
4. **Promotion Viewer** - View active promotions with PDF links

### Key Features
- 🔐 Role-based authentication with Clerk
- 📍 GPS location verification for check-ins
- 📷 Camera integration for photo submissions
- 💾 Offline data caching with AsyncStorage
- 🔄 Pull-to-refresh functionality
- 🎨 Modern UI with Tailwind-inspired styling

---

## 🌐 API Endpoints

### Authentication & Users
- `POST /api/users` - Create or update user
- `GET /api/users/clerk/:clerk_id` - Get user by Clerk ID
- `GET /api/users` - Get all users (Admin/Supervisor only)

### Stores
- `GET /api/stores` - Get all stores (filtered by assigned PC)
- `POST /api/stores` - Create store (Admin/Supervisor)
- `GET /api/stores/:id` - Get store details
- `PATCH /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store (Admin)

### OSA (On-Shelf Availability)
- `POST /api/osa` - Submit OSA record (with photo)
- `GET /api/osa` - Get OSA records (filtered by store/PC)
- `GET /api/osa/:id` - Get OSA record details
- `DELETE /api/osa/:id` - Delete OSA record

### Displays
- `POST /api/displays` - Submit display record (with photo)
- `GET /api/displays` - Get display records
- `PATCH /api/displays/:id/verify` - Verify display (Supervisor/Admin)
- `DELETE /api/displays/:id` - Delete display

### Surveys
- `POST /api/surveys` - Submit survey (with photo)
- `GET /api/surveys` - Get surveys (filtered by template/store/PC)
- `GET /api/surveys/:id` - Get survey details
- `DELETE /api/surveys/:id` - Delete survey

### Promotions
- `POST /api/promotions` - Upload promotion PDF (Admin/Sales/Vendor)
- `GET /api/promotions` - Get promotions (filter by active status)
- `GET /api/promotions/:id` - Get promotion details
- `DELETE /api/promotions/:id` - Delete promotion (Admin/Sales)

---

## 📁 Environment Variables

### Backend (`/backend/.env`)

```bash
PORT=5001
NODE_ENV=development

CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
CLERK_SECRET_KEY=<your_clerk_secret_key>

DATABASE_URL=<your_neon_postgres_connection_url>

REDIS_URL=<your_redis_connection_url>

CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
```

### Mobile (`/mobile/.env`)

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:5001`

### 2. Mobile App Setup

```bash
cd mobile
npm install
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

---

## 🗄️ Database Schema

The app uses PostgreSQL with the following tables:
- `users` - User accounts with roles
- `stores` - Store locations with assigned PCs
- `osa_records` - On-shelf availability records
- `displays` - Special display records
- `surveys` - Market survey submissions
- `promotions` - Promotion PDFs and details

All tables are automatically created on first server start.

---

## 🔑 Setting Up Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Get your publishable and secret keys
4. Add keys to `.env` files in both backend and mobile
5. Configure user roles in Clerk dashboard under "Public Metadata"

---

## 📦 Dependencies

### Backend
- `@clerk/clerk-sdk-node` - Authentication
- `@neondatabase/serverless` - PostgreSQL client
- `cloudinary` & `multer` - File uploads
- `express` - Web framework
- `@upstash/redis` - Rate limiting

### Mobile
- `@clerk/clerk-expo` - Authentication
- `expo-image-picker` - Camera access
- `expo-location` - GPS tracking
- `zustand` - State management
- `axios` - HTTP client

---

## 🧪 Testing

1. Create test users in Clerk with different roles
2. Assign stores to PC users
3. Test each module (OSA, Display, Survey, Promotions)
4. Verify role-based access control

---

## 🚀 Deployment

### Backend
- Deploy to **Railway**, **Render**, or **Fly.io**
- Set environment variables in platform dashboard
- Ensure NeonDB and Upstash Redis are accessible

### Mobile
- Build with `eas build` (Expo Application Services)
- Submit to App Store / Play Store
- Update `EXPO_PUBLIC_API_URL` to production backend URL

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
