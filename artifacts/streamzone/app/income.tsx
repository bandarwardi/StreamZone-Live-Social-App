import React from 'react';
import { useRouter } from 'expo-router';
import { IncomeScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function IncomeRoute() {
  const router = useRouter();
  return <IncomeScreen palette={colors.dark} onBack={() => router.back()} />;
}