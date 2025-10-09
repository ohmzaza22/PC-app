import { Platform } from 'react-native';

// Get API URL based on platform
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // If explicit URL is set, use it
  if (envUrl && envUrl !== 'http://localhost:5001/api') {
    return envUrl;
  }
  
  // Platform-specific defaults
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine
    return 'http://10.0.2.2:5001/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:5001/api';
  } else {
    // Web
    return 'http://localhost:5001/api';
  }
};

export const API_URL = getApiUrl();

export const config = {
  API_URL,
  API_TIMEOUT: 60000, // 60 seconds
};
