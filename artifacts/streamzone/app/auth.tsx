import React from 'react';
import { useRouter } from 'expo-router';
import { AuthScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';
import { useStreamStore } from '@/store/useStreamStore';

export default function AuthRoute() {
  const router = useRouter();
  const setLoggedIn = useStreamStore((state) => state.setLoggedIn);
  const continueDemo = () => { /* TODO: Replace with Clerk/Replit authentication in production. */ setLoggedIn(true); router.replace('/(tabs)'); };
  return <AuthScreen palette={colors.dark} onBack={() => router.back()} onComplete={continueDemo} />;
}