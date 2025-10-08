import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setAuthToken } from '../lib/api';

/**
 * Custom hook to manage Clerk authentication token
 * Automatically sets and refreshes the token
 */
export function useAuthToken() {
  const { getToken } = useAuth();
  const tokenRef = useRef(null);

  // Initialize token on mount
  useEffect(() => {
    const initToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          tokenRef.current = token;
          setAuthToken(token);
        }
      } catch (error) {
        console.error('Error initializing token:', error);
      }
    };

    initToken();
  }, [getToken]);

  // Refresh token periodically (every 25 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = await getToken({ force: true });
        if (token) {
          tokenRef.current = token;
          setAuthToken(token);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 25 * 60 * 1000);

    return () => clearInterval(interval);
  }, [getToken]);

  // Return function to manually refresh token
  const refreshToken = async () => {
    try {
      const token = await getToken({ force: true });
      if (token) {
        tokenRef.current = token;
        setAuthToken(token);
        return token;
      }
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      throw error;
    }
  };

  return { refreshToken, currentToken: tokenRef.current };
}
