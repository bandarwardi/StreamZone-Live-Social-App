import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LiveRoom } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function RoomRoute() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: 'room' | 'pk' | 'multi' | 'voice' }>();
  return <LiveRoom palette={colors.dark} mode={mode ?? 'room'} onClose={() => router.back()} />;
}