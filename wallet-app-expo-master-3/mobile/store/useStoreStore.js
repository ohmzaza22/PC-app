import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeAPI } from '../lib/api';

export const useStoreStore = create((set, get) => ({
  stores: [],
  selectedStore: null,
  isLoading: false,
  error: null,

  // Fetch stores
  fetchStores: async (assignedPcId = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await storeAPI.getAll(assignedPcId);
      const stores = response.data;
      set({ stores, isLoading: false });

      // Cache stores for offline access
      await AsyncStorage.setItem('cached_stores', JSON.stringify(stores));
      
      return stores;
    } catch (error) {
      console.error('Error fetching stores:', error);
      
      // Try to load from cache
      try {
        const cached = await AsyncStorage.getItem('cached_stores');
        if (cached) {
          const stores = JSON.parse(cached);
          set({ stores, isLoading: false, error: 'Using cached data (offline)' });
          return stores;
        }
      } catch (cacheError) {
        console.error('Error loading cached stores:', cacheError);
      }
      
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Select a store
  selectStore: (store) => {
    set({ selectedStore: store });
  },

  // Clear selected store
  clearSelectedStore: () => {
    set({ selectedStore: null });
  },

  // Get store by ID
  getStoreById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await storeAPI.getById(id);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching store:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
