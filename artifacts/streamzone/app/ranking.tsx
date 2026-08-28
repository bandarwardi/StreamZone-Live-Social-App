import React from 'react';
import { useRouter } from 'expo-router';
import { RankingScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function RankingRoute() {
  const router = useRouter();
  return <RankingScreen palette={colors.dark} onBack={() => router.back()} />;
}