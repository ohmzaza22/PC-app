# Mobile App Documentation

## 📱 Overview

PC Field App Mobile Application สร้างด้วย React Native และ Expo รองรับทั้ง iOS และ Android ใช้ Expo Router สำหรับ file-based routing และ Zustand สำหรับ state management

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│            React Native + Expo App                  │
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │   Screens  │  │ Components │  │  Navigation  │ │
│  │ (Expo      │  │ (Reusable) │  │ (Expo Router)│ │
│  │  Router)   │  │            │  │              │ │
│  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘ │
│         │               │                │         │
│  ┌──────▼───────────────▼────────────────▼───────┐ │
│  │         State Management (Zustand)            │ │
│  │  • Auth Store  • Store Store  • Map Store    │ │
│  │  • Offline Store                              │ │
│  └──────────────────┬────────────────────────────┘ │
│                     │                               │
│  ┌──────────────────▼────────────────────────────┐ │
│  │          API Client (Axios)                   │ │
│  │  • Authentication  • Request Interceptors    │ │
│  │  • Response Handlers                         │ │
│  └──────────────────┬────────────────────────────┘ │
└────────────────────┼──────────────────────────────┘
                     │ HTTP/REST
         ┌───────────▼───────────┐
         │   Backend API         │
         │   (Node.js/Express)   │
         └───────────────────────┘
```

## 📁 Project Structure

```
mobile/
├── app/                          # Screens (Expo Router)
│   ├── (auth)/                  # Authentication screens
│   │   ├── _layout.jsx          # Auth layout wrapper
│   │   ├── sign-in.jsx          # Sign in screen
│   │   └── sign-up.jsx          # Sign up screen
│   │
│   ├── (root)/                  # Main app screens (authenticated)
│   │   ├── _layout.jsx          # Root layout with tabs
│   │   ├── index.jsx            # Home/Dashboard
│   │   ├── check-in.jsx         # Check-in screen
│   │   ├── osa.jsx              # OSA record screen
│   │   ├── display.jsx          # Display record screen
│   │   ├── survey.jsx           # Survey screen
│   │   ├── promotions.jsx       # Promotions list
│   │   ├── add-store.jsx        # Add new store
│   │   ├── edit-store.jsx       # Edit store info
│   │   ├── assign-task.jsx      # MC: Assign tasks
│   │   ├── task-assignments.jsx # MC: View assignments
│   │   ├── review-tasks.jsx     # MC: Review/approve
│   │   ├── rejected-tasks.jsx   # PC: Rejected tasks
│   │   ├── admin-users.jsx      # Admin: User management
│   │   ├── admin-stores.jsx     # Admin: Store management
│   │   ├── admin-reports.jsx    # Admin: Reports
│   │   └── mc-dashboard.jsx     # MC: Dashboard
│   │
│   ├── _layout.jsx              # Root app layout
│   └── index.jsx                # App entry point
│
├── components/                   # Reusable components
│   ├── animated/                # Animated components
│   │   ├── AnimatedBadge.jsx
│   │   ├── AnimatedButton.jsx
│   │   ├── AnimatedCard.jsx
│   │   ├── AnimatedListItem.jsx
│   │   ├── AnimatedModal.jsx
│   │   ├── AnimatedPage.jsx
│   │   └── index.js
│   │
│   ├── loaders/                 # Loading components
│   │   ├── AnimatedSpinner.jsx
│   │   ├── LoadingOverlay.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── ShimmerPlaceholder.jsx
│   │   ├── SkeletonCard.jsx
│   │   ├── SkeletonList.jsx
│   │   └── index.js
│   │
│   ├── CheckInStatus.jsx        # Check-in status display
│   ├── MapView.jsx              # Native map component
│   ├── MapView.web.jsx          # Web map component
│   ├── PageHeader.jsx           # Page header component
│   ├── PageLoader.jsx           # Full page loader
│   ├── SafeScreen.jsx           # Safe area wrapper
│   └── SignOutButton.jsx        # Sign out button
│
├── store/                       # State management (Zustand)
│   ├── useAuthStore.js          # Authentication state
│   ├── useMapStore.js           # Map state
│   ├── useOfflineStore.js       # Offline data sync
│   └── useStoreStore.js         # Store data
│
├── lib/                         # Core libraries
│   └── api.js                   # API client (Axios)
│
├── utils/                       # Utility functions
│   ├── dateUtils.js             # Date formatting
│   ├── locationUtils.js         # GPS/Location helpers
│   ├── mapUtils.js              # Map utilities
│   └── validation.js            # Input validation
│
├── constants/                   # Constants & config
│   ├── colors.js                # Color theme
│   └── config.js                # App configuration
│
├── context/                     # React context
│   └── ThemeContext.jsx         # Theme provider
│
├── hooks/                       # Custom React hooks
│   ├── useCurrentLocation.js    # Current location hook
│   └── usePermissions.js        # Permissions hook
│
├── assets/                      # Static assets
│   └── styles/
│       └── auth.styles.js       # Auth screen styles
│
├── .env.example                 # Environment variables template
├── app.json                     # Expo configuration
├── package.json
└── README.md
```

## 🎨 Design System

### Color Palette
```javascript
// constants/colors.js
export const colors = {
  primary: '#007AFF',      // iOS Blue
  success: '#34C759',      // Green
  warning: '#FF9500',      // Orange
  danger: '#FF3B30',       // Red
  background: '#F2F2F7',   // Light Gray
  card: '#FFFFFF',         // White
  text: '#000000',         // Black
  textSecondary: '#8E8E93' // Gray
};
```

### Typography
```javascript
// Text components use default system fonts
- iOS: San Francisco
- Android: Roboto
```

## 🧭 Navigation Structure

### File-Based Routing (Expo Router)
```
/(auth)/sign-in     → Sign In Screen
/(auth)/sign-up     → Sign Up Screen
/(root)/            → Home (Tabs)
/(root)/check-in    → Check-in Screen
/(root)/osa         → OSA Screen
... และอื่นๆ
```

### Navigation Flow
```
Entry Point → _layout.jsx
    │
    ├─ Not Authenticated → (auth)/sign-in
    │
    └─ Authenticated → (root)/_layout
           │
           ├─ PC User → Bottom Tabs
           │     ├─ Home
           │     ├─ Check-in
           │     ├─ Tasks
           │     └─ Profile
           │
           └─ MC/Admin → Additional Screens
                 ├─ Assign Tasks
                 ├─ Review Tasks
                 └─ Reports
```

## 🔐 Authentication Flow

### Clerk Integration
```javascript
// app/_layout.jsx
<ClerkProvider publishableKey={CLERK_KEY}>
  <TokenRefresher />  // Auto-refresh token every 25 min
  <Slot />
</ClerkProvider>
```

### Auto Token Refresh
```javascript
// Refresh token every 25 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    const newToken = await getToken({ force: true });
    if (newToken) setAuthToken(newToken);
  }, 25 * 60 * 1000);
}, []);
```

### Auth Store (Zustand)
```javascript
// store/useAuthStore.js
export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  clearUser: () => set({ user: null }),
}));
```

## 🗺️ Map Integration

### React Native Maps
```javascript
import MapView, { Marker } from 'react-native-maps';

<MapView
  region={mapRegion}
  showsUserLocation
  followsUserLocation
>
  {stores.map(store => (
    <Marker
      key={store.id}
      coordinate={store.location}
      title={store.store_name}
    />
  ))}
</MapView>
```

### Map Store (Zustand)
```javascript
// store/useMapStore.js
export const useMapStore = create((set) => ({
  region: null,
  markers: [],
  selectedStore: null,
  setRegion: (region) => set({ region }),
  setMarkers: (markers) => set({ markers }),
}));
```

### Location Utilities
```javascript
// utils/locationUtils.js
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula
  // Returns distance in meters
};

export const isWithinRadius = (userLoc, storeLoc, radiusMeters) => {
  const distance = calculateDistance(...);
  return distance <= radiusMeters;
};
```

## 📡 API Integration

### API Client Setup
```javascript
// lib/api.js
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor (add auth token)
api.interceptors.request.use((config) => {
  if (globalClerkToken) {
    config.headers.Authorization = `Bearer ${globalClerkToken}`;
  }
  return config;
});
```

### API Modules
```javascript
// User API
export const userAPI = {
  createOrUpdate: (data) => api.post('/users', data),
  getByClerkId: (id) => api.get(`/users/clerk/${id}`),
};

// Store API
export const storeAPI = {
  getAll: () => api.get('/stores'),
  create: (data) => api.post('/stores', data),
};

// Task API
export const taskAPI = {
  getCheckinEligibility: () => api.get('/pc/checkin-eligibility'),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, {status}),
};
```

### Usage in Components
```javascript
import { taskAPI } from '../lib/api';

const fetchTasks = async () => {
  try {
    const { data } = await taskAPI.getCheckinEligibility();
    setStores(data.eligibleStores);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📸 Image Handling

### Expo Image Picker
```javascript
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  
  if (!result.canceled) {
    return result.assets[0].uri;
  }
};
```

### Upload to Backend
```javascript
const uploadOSA = async (data, photos) => {
  const formData = new FormData();
  
  // Append JSON data
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  
  // Append photos
  photos.forEach((uri, index) => {
    formData.append('photos', {
      uri,
      type: 'image/jpeg',
      name: `photo_${index}.jpg`,
    });
  });
  
  await osaAPI.create(formData);
};
```

## 📍 Location Services

### Request Permissions
```javascript
import * as Location from 'expo-location';

const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission denied');
    return false;
  }
  return true;
};
```

### Get Current Location
```javascript
const getCurrentLocation = async () => {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};
```

### Check-in Validation
```javascript
const validateCheckIn = async (storeLocation) => {
  const userLocation = await getCurrentLocation();
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    storeLocation.latitude,
    storeLocation.longitude
  );
  
  const MAX_DISTANCE = 100; // meters
  return distance <= MAX_DISTANCE;
};
```

## 🎭 Animations

### React Native Reanimated
```javascript
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

const AnimatedButton = ({ onPress, children }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    scale.value = withSpring(0.95);
    setTimeout(() => {
      scale.value = withSpring(1);
      onPress();
    }, 100);
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={handlePress}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};
```

### Animated Components
- `AnimatedBadge` - Badge with entrance animation
- `AnimatedButton` - Button with press animation
- `AnimatedCard` - Card with slide-in animation
- `AnimatedListItem` - List item with stagger animation
- `AnimatedModal` - Modal with fade/scale animation

## 💾 Offline Support

### Offline Store (Zustand)
```javascript
// store/useOfflineStore.js
export const useOfflineStore = create((set, get) => ({
  pendingData: [],
  
  addPendingData: (data) => set((state) => ({
    pendingData: [...state.pendingData, data],
  })),
  
  syncPendingData: async () => {
    const { pendingData } = get();
    for (const data of pendingData) {
      try {
        await api.post(data.endpoint, data.payload);
        // Remove synced data
        set((state) => ({
          pendingData: state.pendingData.filter(d => d !== data),
        }));
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  },
}));
```

### Network Status Detection
```javascript
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // Sync pending data
      useOfflineStore.getState().syncPendingData();
    }
  });
  
  return unsubscribe;
}, []);
```

## 🎨 Styling

### StyleSheet API
```javascript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
```

### Platform-Specific Styles
```javascript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    ...Platform.select({
      ios: { fontFamily: 'System' },
      android: { fontFamily: 'Roboto' },
    }),
  },
});
```

## 🧪 Testing

### Component Testing
```javascript
// ใช้ Jest + React Native Testing Library
import { render, fireEvent } from '@testing-library/react-native';

test('button press', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Button onPress={onPress}>Click</Button>);
  
  fireEvent.press(getByText('Click'));
  expect(onPress).toHaveBeenCalled();
});
```

### API Testing
```bash
# ทดสอบ API endpoints ด้วย curl
curl -X GET "http://localhost:5001/api/health"
```

## 🚀 Build & Deployment

### Development Build
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Production Build (EAS)
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
```

### Environment Configuration
```javascript
// app.json
{
  "expo": {
    "extra": {
      "clerkPublishableKey": process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      "apiUrl": process.env.EXPO_PUBLIC_API_URL
    }
  }
}
```

## 📊 Performance Optimization

### Image Optimization
```javascript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### List Optimization
```javascript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  estimatedItemSize={100}
/>
```

### Memoization
```javascript
import { memo, useMemo, useCallback } from 'react';

const MemoizedComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => transform(item));
  }, [data]);
  
  const handlePress = useCallback(() => {
    console.log('Pressed');
  }, []);
  
  return <View>...</View>;
});
```

## 🐛 Debugging

### React Native Debugger
```bash
# Enable Debug Mode
- Shake device (physical device)
- Press Cmd+D (iOS Simulator)
- Press Cmd+M (Android Emulator)

# Select "Debug"
```

### Console Logs
```javascript
console.log('Info:', data);
console.error('Error:', error);
console.warn('Warning:', warning);
```

### Network Debugging
```javascript
// lib/api.js
api.interceptors.request.use((config) => {
  console.log('Request:', config.method.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

## 🔧 Common Issues

### Metro Bundler Issues
```bash
# Clear cache
npm start -- --reset-cache

# Clean install
rm -rf node_modules
npm install
```

### iOS Build Issues
```bash
cd ios/
pod install
cd ..
npm run ios
```

### Android Build Issues
```bash
cd android/
./gradlew clean
cd ..
npm run android
```

## 📝 Best Practices

1. **Use TypeScript** - Type safety (ถ้าเป็นไปได้)
2. **Component Composition** - แยก components ให้เล็ก reusable
3. **State Management** - ใช้ Zustand สำหรับ global state
4. **Error Boundaries** - จัดการ errors อย่างเหมาะสม
5. **Performance** - ใช้ memo, useMemo, useCallback
6. **Accessibility** - เพิ่ม accessibility props
7. **Testing** - เขียน tests สำหรับ critical features

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

**Updated**: November 2025
