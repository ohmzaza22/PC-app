# PC Field App - Mobile 📱

A premium React Native mobile application built with Expo for field operations management.

## ✨ Features

- 🎨 **Premium Animation System** - Smooth 60fps animations throughout the app
- 🔐 **Authentication** - Clerk-based auth with role management
- 📍 **Location Services** - Store mapping and check-in functionality
- 📊 **Task Management** - OSA, Display, Survey, and Promotions modules
- 👥 **Multi-Role Support** - PC, Supervisor, Admin, Sales, Vendor roles
- 🎯 **Offline-First** - Zustand state management with persistence

## 🚀 Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables
   
   Copy `.env.example` to `.env` and add your keys

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## 🎨 Animation System

This app features a comprehensive animation system built with **React Native Reanimated** for smooth, performant 60fps animations.

### Quick Start
```jsx
// Import animated components
import { AnimatedButton, AnimatedCard } from '@/components/animated';
import { AnimatedSpinner, SkeletonCard } from '@/components/loaders';
import { useFadeIn, usePressAnimation } from '@/hooks/useAnimations';

// Use in your components
<AnimatedButton title="Submit" variant="primary" onPress={handlePress} />
```

### Documentation
- 📘 **[ANIMATIONS_GUIDE.md](./ANIMATIONS_GUIDE.md)** - Complete reference guide
- 📝 **[ANIMATION_CHANGELOG.md](./ANIMATION_CHANGELOG.md)** - Implementation details
- 🎨 **Navigate to `/animation-demo`** - Interactive demo in-app

### Features
- ✨ 12 reusable animation hooks
- 🎯 6 animated interactive components
- ⏳ 6 loader/skeleton components
- 🎪 Staggered list animations
- 📱 Press feedback on all interactions
- 🔄 Page transitions
- 💫 Modal animations

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
