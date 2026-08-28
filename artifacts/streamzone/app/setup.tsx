import React from 'react';
import { useRouter } from 'expo-router';
import { SetupScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function SetupRoute() {
  const router = useRouter();
  return <SetupScreen palette={colors.dark} onBack={() => router.back()} onDone={() => router.replace('/(tabs)/profile')} />;
}