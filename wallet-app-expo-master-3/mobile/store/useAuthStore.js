import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { userAPI, setAuthToken } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  userRole: null,
  isLoading: false,
  error: null,

  // Initialize user from Clerk
  initUser: async (clerkUser) => {
    set({ isLoading: true, error: null });
    try {
      const roleFromClerk = clerkUser.publicMetadata?.role || 'PC';
      
      console.log('🔐 Clerk User Data:', {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        publicMetadata: clerkUser.publicMetadata,
        roleFromClerk: roleFromClerk
      });

      // Get or create user in our database
      const response = await userAPI.createOrUpdate({
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName,
        role: roleFromClerk,
      });

      const userData = response.data;
      
      console.log('✅ User synced to DB:', userData);
      
      set({ 
        user: userData, 
        userRole: userData.role,
        isLoading: false 
      });

      // Cache user data
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('❌ Error initializing user:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Load cached user data
  loadCachedUser: async () => {
    try {
      const cachedUser = await AsyncStorage.getItem('user_data');
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        set({ user: userData, userRole: userData.role });
        return userData;
      }
    } catch (error) {
      console.error('Error loading cached user:', error);
    }
    return null;
  },

  // Update user role
  updateUserRole: (role) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      set({ user: updatedUser, userRole: role });
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  },

  // Clear user data on logout
  clearUser: async () => {
    set({ user: null, userRole: null, error: null });
    await AsyncStorage.removeItem('user_data');
    await SecureStore.deleteItemAsync('clerk_token');
  },
}));
