# Developer Guide - PC Field App

## 📚 คู่มือสำหรับนักพัฒนา

เอกสารนี้เป็นคู่มือสำหรับนักพัฒนาที่ต้องการเข้าใจและพัฒนาต่อยอด PC Field App

---

## 🎯 สำหรับนักพัฒนาใหม่

### การเริ่มต้น (Quick Start)

1. **อ่านเอกสารหลัก**
   - [README.md](../README.md) - ภาพรวมโปรเจกต์
   - [Backend README](../backend/README.md) - Backend documentation
   - [Mobile README](../mobile/README.md) - Mobile documentation

2. **ศึกษาสถาปัตยกรรม**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
   - [API.md](./API.md) - API documentation

3. **ติดตั้งและรันโปรเจกต์**
   ```bash
   # Backend
   cd backend && npm install && npm run dev
   
   # Mobile
   cd mobile && npm install && npm start
   ```

### โครงสร้างโปรเจกต์ (Project Structure)

```
PC-app/
├── docs/                       # เอกสารทั้งหมด
│   ├── API.md                 # API documentation
│   ├── ARCHITECTURE.md        # System architecture
│   └── DEVELOPER_GUIDE.md     # (ไฟล์นี้)
│
├── backend/                   # Backend API
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/       # Middleware (auth, rate limit)
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Entry point
│   └── package.json
│
└── mobile/                    # Mobile App
    ├── app/                  # Screens (Expo Router)
    ├── components/          # Reusable components
    ├── store/              # State management (Zustand)
    ├── lib/                # API client
    ├── utils/              # Helper functions
    └── package.json
```

---

## 🔨 การพัฒนา Backend

### การเพิ่ม API Endpoint ใหม่

#### 1. สร้าง Controller

```javascript
// backend/src/controllers/myFeatureController.js

/**
 * My Feature Controller
 * คำอธิบายของ feature
 */

import { sql } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all items
 * @route GET /api/my-feature
 * @access Private
 */
export async function getAllItems(req, res) {
  try {
    const items = await sql`SELECT * FROM my_table ORDER BY created_at DESC`;
    sendSuccess(res, { items });
  } catch (error) {
    console.error('Error:', error);
    sendError(res, error.message);
  }
}

/**
 * Create item
 * @route POST /api/my-feature
 * @access Private (MC only)
 */
export async function createItem(req, res) {
  try {
    const { name, description } = req.body;
    
    // Validation
    if (!name) {
      return sendValidationError(res, 'Name is required');
    }
    
    // Create
    const [item] = await sql`
      INSERT INTO my_table (name, description)
      VALUES (${name}, ${description})
      RETURNING *
    `;
    
    sendCreated(res, { item }, 'Item created successfully');
  } catch (error) {
    console.error('Error:', error);
    sendError(res, error.message);
  }
}
```

#### 2. สร้าง Route

```javascript
// backend/src/routes/myFeatureRoute.js

import express from 'express';
import { verifyClerkToken, requireRole } from '../middleware/clerkAuth.js';
import { getAllItems, createItem } from '../controllers/myFeatureController.js';

const router = express.Router();

/**
 * ทุก route ต้องผ่าน authentication
 */

// GET /api/my-feature
router.get('/', verifyClerkToken, getAllItems);

// POST /api/my-feature (MC/Admin only)
router.post('/', verifyClerkToken, requireRole('MC', 'Admin'), createItem);

export default router;
```

#### 3. Register Route ใน server.js

```javascript
// backend/src/server.js

import myFeatureRoute from './routes/myFeatureRoute.js';

// ...

app.use('/api/my-feature', myFeatureRoute);
```

### การเพิ่ม Database Table

#### 1. สร้าง Migration File

```sql
-- backend/src/migrations/004_add_my_table.sql

CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX idx_my_table_user_id ON my_table(user_id);
CREATE INDEX idx_my_table_created_at ON my_table(created_at);
```

#### 2. รัน Migration

```bash
npm run db:migrate
```

### Best Practices - Backend

1. **Always use try-catch** ในทุก async functions
2. **Validate input** ก่อนบันทึกลง database
3. **Use prepared statements** (template literals) เพื่อป้องกัน SQL injection
4. **Return consistent responses** ใช้ helper functions จาก `utils/response.js`
5. **Log errors properly** พร้อม context
6. **Comment your code** อธิบาย business logic ที่ซับซ้อน

---

## 📱 การพัฒนา Mobile App

### การเพิ่ม Screen ใหม่

#### 1. สร้าง Screen File

```jsx
// mobile/app/(root)/my-feature.jsx

import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { myFeatureAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { SafeScreen } from '../components/SafeScreen';

/**
 * My Feature Screen
 * คำอธิบาย feature
 */
export default function MyFeatureScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await myFeatureAPI.getAll();
      setItems(data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <SafeScreen>
      <PageHeader title="My Feature" />
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
```

#### 2. เพิ่ม API Client

```javascript
// mobile/lib/api.js

// เพิ่มใน API modules
export const myFeatureAPI = {
  getAll: () => api.get('/my-feature'),
  create: (data) => api.post('/my-feature', data),
  update: (id, data) => api.patch(`/my-feature/${id}`, data),
  delete: (id) => api.delete(`/my-feature/${id}`),
};
```

#### 3. เพิ่ม Navigation

```jsx
// mobile/app/(root)/_layout.jsx

// เพิ่ม tab หรือ stack screen
<Tabs.Screen
  name="my-feature"
  options={{
    title: 'My Feature',
    tabBarIcon: ({ color }) => <Icon name="feature" color={color} />,
  }}
/>
```

### การใช้ State Management (Zustand)

```javascript
// mobile/store/useMyFeatureStore.js

import { create } from 'zustand';

/**
 * My Feature Store
 * Global state สำหรับ My Feature
 */
export const useMyFeatureStore = create((set, get) => ({
  // State
  items: [],
  selectedItem: null,
  loading: false,

  // Actions
  setItems: (items) => set({ items }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setLoading: (loading) => set({ loading }),

  // Async actions
  fetchItems: async () => {
    set({ loading: true });
    try {
      const { data } = await myFeatureAPI.getAll();
      set({ items: data.items });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (itemData) => {
    try {
      const { data } = await myFeatureAPI.create(itemData);
      set((state) => ({
        items: [...state.items, data.item],
      }));
      return data.item;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },
}));
```

### การใช้ใน Component

```jsx
import { useMyFeatureStore } from '../store/useMyFeatureStore';

export default function MyComponent() {
  const { items, loading, fetchItems, addItem } = useMyFeatureStore();

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    try {
      await addItem({ name: 'New Item' });
      Alert.alert('Success', 'Item added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  return (
    <View>
      {loading ? <Spinner /> : <ItemList items={items} />}
      <Button onPress={handleAdd} title="Add Item" />
    </View>
  );
}
```

### Best Practices - Mobile

1. **Use TypeScript** ถ้าเป็นไปได้
2. **Component composition** แบ่ง components ให้เล็กและ reusable
3. **Handle loading states** แสดง loading indicator ระหว่างรอข้อมูล
4. **Error handling** แสดง error messages ที่เป็นมิตรกับผู้ใช้
5. **Optimize performance** ใช้ `memo`, `useMemo`, `useCallback`
6. **Test on real devices** อย่าพึ่ง simulator อย่างเดียว

---

## 🧪 Testing

### Backend Testing

```javascript
// Manual testing with curl
curl -X GET "http://localhost:5001/api/my-feature" \
  -H "Authorization: Bearer YOUR_TOKEN"

// Test with data
curl -X POST "http://localhost:5001/api/my-feature" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Test"}'
```

### Mobile Testing

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on real device (Expo Go)
npm start
# Then scan QR code with Expo Go app
```

---

## 🐛 Debugging

### Backend Debugging

```javascript
// เพิ่ม console.log ใน controllers
console.log('📍 Request params:', req.params);
console.log('📍 Request body:', req.body);
console.log('📍 Request user:', req.userId);

// ดู database queries
console.log('📍 Query result:', result);
```

### Mobile Debugging

```javascript
// Console logs
console.log('📍 State:', state);
console.log('📍 API response:', data);

// React Native Debugger
// - Shake device
// - Select "Debug" 
// - Open Chrome DevTools
```

---

## 🔒 Security Checklist

### Backend
- [ ] ทุก endpoint มี authentication (ยกเว้น public endpoints)
- [ ] ใช้ role-based access control
- [ ] Validate input ทุก field
- [ ] ใช้ prepared statements (ป้องกัน SQL injection)
- [ ] Rate limiting enabled
- [ ] Environment variables secure (ไม่ commit .env)

### Mobile
- [ ] JWT tokens จัดเก็บ securely (Expo SecureStore)
- [ ] API keys ไม่ hardcode ในโค้ด
- [ ] Validate user input
- [ ] Handle sensitive data properly
- [ ] Test authentication flows

---

## 📦 Deployment

### Backend Deployment

```bash
# Build
npm install --production

# Set environment variables
export DATABASE_URL=...
export CLERK_SECRET_KEY=...
# etc.

# Run migrations
npm run db:migrate

# Start server
npm start
```

### Mobile Deployment (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 📊 Performance Optimization

### Backend
- **Database Indexes** - สร้าง indexes สำหรับ columns ที่ query บ่อย
- **Query Optimization** - ใช้ JOIN แทนการ query หลายรอบ
- **Caching** - Cache data ที่ไม่เปลี่ยนบ่อย
- **Connection Pooling** - NeonDB จัดการให้อัตโนมัติ

### Mobile
- **Image Optimization** - ใช้ Expo Image กับ caching
- **List Virtualization** - ใช้ FlashList แทน FlatList
- **Code Splitting** - Lazy load screens
- **Bundle Size** - ลบ dependencies ที่ไม่ใช้

---

## 🆘 Common Issues & Solutions

### Backend

**Issue**: Database connection fails
```
Solution: ตรวจสอบ DATABASE_URL ใน .env
```

**Issue**: Unauthorized errors
```
Solution: ตรวจสอบ Clerk token และ CLERK_SECRET_KEY
```

**Issue**: Rate limit exceeded
```
Solution: ปรับ rate limit config หรือรอ 15 นาที
```

### Mobile

**Issue**: Cannot connect to API
```
Solution: ตรวจสอบ API_URL ใน .env
- iOS simulator: localhost
- Android emulator: 10.0.2.2
- Real device: IP address ของ computer
```

**Issue**: Expo won't start
```
Solution:
- Clear cache: npm start -- --clear
- Reinstall: rm -rf node_modules && npm install
```

**Issue**: Build fails
```
Solution:
- ตรวจสอบ app.json configuration
- ดู EAS build logs
- ตรวจสอบ dependencies compatibility
```

---

## 📚 Resources

### Official Documentation
- [Node.js](https://nodejs.org/docs)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [Clerk](https://clerk.com/docs)

### Libraries Used
- [Axios](https://axios-http.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

---

## 🤝 Contributing

### Workflow
1. สร้าง feature branch จาก `main`
   ```bash
   git checkout -b feature/my-feature
   ```

2. เขียนโค้ดและ test
3. Commit with meaningful messages
   ```bash
   git commit -m "feat: Add my feature"
   ```

4. Push และสร้าง Pull Request
   ```bash
   git push origin feature/my-feature
   ```

### Commit Message Convention
```
feat: เพิ่ม feature ใหม่
fix: แก้ bug
docs: อัพเดทเอกสาร
style: แก้ formatting
refactor: ปรับปรุงโค้ดโดยไม่เปลี่ยนการทำงาน
test: เพิ่ม tests
chore: งานอื่นๆ (update dependencies, etc.)
```

---

## 📞 Support

หากมีคำถามหรือพบปัญหา:
1. ตรวจสอบเอกสารนี้และ README
2. ดู logs และ error messages
3. ค้นหาใน issues เดิม
4. สร้าง issue ใหม่พร้อมรายละเอียด

---

**Happy Coding! 🚀**

Last Updated: November 2025
