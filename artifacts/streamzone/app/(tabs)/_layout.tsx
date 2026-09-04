import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/store/authStore';

export default function TabLayout() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (!isInitializing) {
    if (!isAuthenticated) return <Redirect href="/auth" />;
    if (!user?.isProfileComplete) return <Redirect href="/setup" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="rooms" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
