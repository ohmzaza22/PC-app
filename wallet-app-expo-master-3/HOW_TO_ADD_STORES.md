# 📍 How to Add Stores to PC Field App

## Overview
Stores need to be added to the database so PCs (field staff) can select them when submitting OSA records, displays, and surveys.

---

## Method 1: Using API Directly (Postman/cURL)

### Prerequisites
1. Backend server running: `cd backend && npm run dev`
2. User authenticated with Clerk (get JWT token)

### Step 1: Get Your Auth Token
After logging in to the mobile app, the JWT token is stored. For testing, you can:
- Use Postman with Clerk authentication
- Or temporarily disable auth in the route for testing

### Step 2: Create a Store via API

**Endpoint:** `POST http://localhost:5001/api/stores`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "store_name": "7-Eleven Sukhumvit Branch",
  "location": {
    "latitude": 13.7563,
    "longitude": 100.5018,
    "address": "123 Sukhumvit Road, Bangkok"
  },
  "assigned_pc_id": 1
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5001/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "store_name": "7-Eleven Sukhumvit Branch",
    "location": {
      "latitude": 13.7563,
      "longitude": 100.5018,
      "address": "123 Sukhumvit Road, Bangkok"
    },
    "assigned_pc_id": 1
  }'
```

---

## Method 2: Create a Seed Script

Create a file: `backend/src/scripts/seedStores.js`

```javascript
import { sql } from "../config/db.js";

const stores = [
  {
    store_name: "7-Eleven Sukhumvit Branch",
    location: { latitude: 13.7563, longitude: 100.5018, address: "123 Sukhumvit Road" },
    assigned_pc_id: 1
  },
  {
    store_name: "Family Mart Silom",
    location: { latitude: 13.7248, longitude: 100.5310, address: "456 Silom Road" },
    assigned_pc_id: 1
  },
  {
    store_name: "Lotus's Rama 4",
    location: { latitude: 13.7200, longitude: 100.5600, address: "789 Rama 4 Road" },
    assigned_pc_id: 2
  },
  {
    store_name: "Big C Ratchadamri",
    location: { latitude: 13.7400, longitude: 100.5400, address: "321 Ratchadamri Road" },
    assigned_pc_id: 2
  },
];

async function seedStores() {
  try {
    console.log("🌱 Seeding stores...");

    for (const store of stores) {
      const result = await sql`
        INSERT INTO stores(store_name, location, assigned_pc_id)
        VALUES (${store.store_name}, ${JSON.stringify(store.location)}, ${store.assigned_pc_id})
        RETURNING *
      `;
      console.log(`✅ Created: ${result[0].store_name}`);
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding stores:", error);
    process.exit(1);
  }
}

seedStores();
```

**Run the seed script:**
```bash
cd backend
node src/scripts/seedStores.js
```

---

## Method 3: Add Admin Panel in Mobile App

### Create Admin Store Management Screen

Create: `mobile/app/(root)/admin-stores.jsx`

```javascript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storeAPI } from '../../lib/api';
import { COLORS } from '../../constants/colors';

export default function AdminStoresScreen() {
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await storeAPI.getAll();
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const addStore = async () => {
    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    setIsAdding(true);
    try {
      await storeAPI.create({
        store_name: storeName,
        location: { address: 'To be updated' },
        assigned_pc_id: null
      });
      
      Alert.alert('Success', 'Store added successfully');
      setStoreName('');
      fetchStores();
    } catch (error) {
      Alert.alert('Error', 'Failed to add store');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Stores</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="Store name"
          value={storeName}
          onChangeText={setStoreName}
        />
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={addStore}
          disabled={isAdding}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.storeItem}>
            <Ionicons name="storefront" size={24} color={COLORS.primary} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{item.store_name}</Text>
              <Text style={styles.storeDetails}>
                {item.pc_name ? `Assigned to: ${item.pc_name}` : 'Unassigned'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  addSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    gap: 12,
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  storeDetails: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
});
```

---

## Method 4: Direct Database Insert (PostgreSQL)

If you have direct access to NeonDB:

```sql
INSERT INTO stores (store_name, location, assigned_pc_id) 
VALUES 
  ('7-Eleven Sukhumvit', '{"latitude": 13.7563, "longitude": 100.5018, "address": "123 Sukhumvit Road"}', 1),
  ('Family Mart Silom', '{"latitude": 13.7248, "longitude": 100.5310, "address": "456 Silom Road"}', 1),
  ('Lotus Rama 4', '{"latitude": 13.7200, "longitude": 100.5600, "address": "789 Rama 4 Road"}', 2);
```

---

## Verify Stores Are Added

### Check via API:
```bash
curl http://localhost:5001/api/stores \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check in Mobile App:
1. Open the app
2. Go to any module (OSA, Display, Survey)
3. Tap on "Select a store"
4. You should see the stores in the dropdown

---

## Assign Stores to PCs

**Update store assignment:**
```bash
curl -X PATCH http://localhost:5001/api/stores/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"assigned_pc_id": 2}'
```

---

## Quick Start: Add Test Stores

Run this in your backend terminal:

```bash
cd backend
node -e "
import { sql } from './src/config/db.js';

const stores = [
  { name: '7-Eleven Branch 1', pc: 1 },
  { name: 'Family Mart Branch 1', pc: 1 },
  { name: 'Lotus Store 1', pc: 2 },
];

for (const s of stores) {
  await sql\`INSERT INTO stores(store_name, location, assigned_pc_id) 
    VALUES (\${s.name}, '{}', \${s.pc})\`;
  console.log('Added:', s.name);
}
"
```

---

## Need Help?

- **Stores not showing?** Check backend logs for errors
- **Auth errors?** Make sure Clerk is configured correctly
- **Can't create stores?** Verify user has ADMIN or SUPERVISOR role

For more details, see the API documentation in `README.md`
