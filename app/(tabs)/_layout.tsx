import React from 'react';
import { Tabs } from 'expo-router';
import { ListIcon, ChartIcon, RadarIcon, NewspaperIcon, UserIcon } from '@/components/ui';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

/** Five-tab IA with a floating glass tab bar. Public analytics need no sign-in. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Watchlist', tabBarIcon: ({ color, size }) => <ListIcon size={size} color={color} /> }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart', tabBarIcon: ({ color, size }) => <ChartIcon size={size} color={color} /> }} />
      <Tabs.Screen name="screeners" options={{ title: 'Screeners', tabBarIcon: ({ color, size }) => <RadarIcon size={size} color={color} /> }} />
      <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: ({ color, size }) => <NewspaperIcon size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserIcon size={size} color={color} /> }} />
      <Tabs.Screen name="portfolio" options={{ href: null }} />
    </Tabs>
  );
}
