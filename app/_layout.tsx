import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { ScreenBackground } from '@/components/ui/Glass';
import { liveManager } from '@/services/live/manager';

// Only use SplashScreen on native platforms
if (Platform.OS !== 'web') {
  const SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      })
  );

  // Dev/test aid: open a route on launch (native only), e.g. EXPO_PUBLIC_INITIAL_ROUTE=/tools/heatmap
  useEffect(() => {
    const initial = process.env.EXPO_PUBLIC_INITIAL_ROUTE;
    if (!hasHydrated || !initial || Platform.OS === 'web' || !__DEV__) return;
    const t = setTimeout(() => router.push(initial as never), 300);
    return () => clearTimeout(t);
  }, [hasHydrated]);

  useEffect(() => {
    liveManager.start();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (Platform.OS !== 'web') {
      const SplashScreen = require('expo-splash-screen');
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <ScreenBackground>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="screener/[id]" />
          <Stack.Screen name="stock/[ticker]" />
          <Stack.Screen name="settings" />
        </Stack>
        </ScreenBackground>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
