import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_QUEUE_KEY = 'offline_submission_queue';

export const useOfflineStore = create((set, get) => ({
  isOnline: true,
  offlineQueue: [],

  // Initialize network listener
  initNetworkListener: () => {
    NetInfo.addEventListener(state => {
      set({ isOnline: state.isConnected });
      
      // Process queue when coming back online
      if (state.isConnected) {
        get().processOfflineQueue();
      }
    });
  },

  // Add item to offline queue
  addToQueue: async (item) => {
    const queue = get().offlineQueue;
    const newQueue = [...queue, { ...item, timestamp: Date.now() }];
    set({ offlineQueue: newQueue });
    
    // Persist queue
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
  },

  // Load offline queue from storage
  loadOfflineQueue: async () => {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        const queue = JSON.parse(queueData);
        set({ offlineQueue: queue });
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  },

  // Process offline queue
  processOfflineQueue: async () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline submissions...`);

    const failedItems = [];
    
    for (const item of queue) {
      try {
        // Process based on type
        switch (item.type) {
          case 'osa':
            // await osaAPI.create(item.data);
            console.log('Processing OSA submission:', item.id);
            break;
          case 'display':
            // await displayAPI.create(item.data);
            console.log('Processing Display submission:', item.id);
            break;
          case 'survey':
            // await surveyAPI.create(item.data);
            console.log('Processing Survey submission:', item.id);
            break;
          default:
            console.warn('Unknown queue item type:', item.type);
        }
      } catch (error) {
        console.error('Error processing queue item:', error);
        failedItems.push(item);
      }
    }

    // Update queue with only failed items
    set({ offlineQueue: failedItems });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
  },

  // Clear offline queue
  clearQueue: async () => {
    set({ offlineQueue: [] });
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
}));
