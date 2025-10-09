import { useAuth } from '@clerk/clerk-expo';
import { setAuthToken } from '../lib/api';
import { useRouter } from 'expo-router';

export function useTokenRefresh() {
  const { getToken, signOut } = useAuth();
  const router = useRouter();

  const setupTokenRefresh = () => {
    const interval = setInterval(async () => {
      try {
        const newToken = await getToken({ force: true });
        setAuthToken(newToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearInterval(interval);
        await signOut();
        router.replace('/sign-in');
      }
    }, 25 * 60 * 1000); // Refresh every 25 minutes

    return () => clearInterval(interval);
  };

  return { setupTokenRefresh };
}
