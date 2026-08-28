import React from 'react';
import { useRouter } from 'expo-router';
import { StoreScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function StoreRoute() {
  const router = useRouter();
  return <StoreScreen palette={colors.dark} onBack={() => router.back()} />;
}