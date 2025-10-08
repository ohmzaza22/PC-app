import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { setAuthToken } from "../lib/api";
import { SafeAreaProvider } from "react-native-safe-area-context";

function AuthTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    const syncToken = async () => {
      try {
        const token = await getToken();
        if (token) {
          setAuthToken(token);
        }
      } catch (error) {
        console.error('Error syncing token:', error);
      }
    };
    syncToken();
  }, [getToken]);

  return null;
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('❌ Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    return null;
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <AuthTokenSync />
        <SafeScreen>
          <Slot />
        </SafeScreen>
        <StatusBar style="dark" />
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
