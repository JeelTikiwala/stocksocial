import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { colors, spacing } from '@/constants';
import {
  HomeIcon,
  GlobeIcon,
  UsersIcon,
  PieChartIcon,
  TrendingIcon,
} from '@/components/ui';
import { useAuthStore } from '@/stores';

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tokens = useAuthStore((state) => state.tokens);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hasValidSession = Boolean(
    isAuthenticated && tokens?.accessToken && tokens?.refreshToken
  );

  if (!hasHydrated) {
    return null;
  }

  if (!hasValidSession) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <HomeIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="markets"
        options={{
          title: 'Markets',
          tabBarIcon: ({ color }) => (
            <GlobeIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => (
            <UsersIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color }) => (
            <PieChartIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <TrendingIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.xs,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
