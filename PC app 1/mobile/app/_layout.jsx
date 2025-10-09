import { Slot, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { setAuthToken } from "../lib/api";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../context/ThemeContext";
import { useEffect } from 'react';

// Add token refresh component
function TokenRefresher() {
  const { getToken, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newToken = await getToken({ force: true });
        if (newToken) {
          setAuthToken(newToken);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearInterval(interval);
        await signOut();
        router.replace('/sign-in');
      }
    }, 25 * 60 * 1000); // Refresh every 25 minutes

    return () => clearInterval(interval);
  }, []);

  return null;
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <TokenRefresher />
          <View style={styles.container}>
            <StatusBar style="auto" />
            <Slot />
          </View>
        </ClerkProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
