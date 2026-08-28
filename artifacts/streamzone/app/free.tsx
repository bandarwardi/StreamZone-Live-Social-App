import React from 'react';
import { useRouter } from 'expo-router';
import { FreeDiamondsScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function FreeRoute() {
  const router = useRouter();
  return <FreeDiamondsScreen palette={colors.dark} onBack={() => router.back()} />;
}