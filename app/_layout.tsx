import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants';
import { useAuthStore } from '@/stores';

// Only use SplashScreen on native platforms
if (Platform.OS !== 'web') {
  const SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tokens = useAuthStore((state) => state.tokens);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hasValidSession = Boolean(
    isAuthenticated && tokens?.accessToken && tokens?.refreshToken
  );

  useEffect(() => {
    if (!hasHydrated) return;

    // Hide splash screen after a short delay (native only)
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
      <StatusBar style="dark" />
      <Stack
        initialRouteName={hasValidSession ? '(tabs)' : '(auth)'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.offWhite },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile/[username]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="stock/[ticker]" />
        <Stack.Screen name="settings" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
