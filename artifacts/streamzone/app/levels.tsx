import React from 'react';
import { useRouter } from 'expo-router';
import { LevelsScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function LevelsRoute() {
  const router = useRouter();
  return <LevelsScreen palette={colors.dark} onBack={() => router.back()} />;
}
