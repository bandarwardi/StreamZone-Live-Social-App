import React from 'react';
import { useRouter } from 'expo-router';
import GoLiveScreen from '@/components/GoLiveScreen';
import colors from '@/constants/colors';

export default function GoLiveRoute() {
  const router = useRouter();
  return <GoLiveScreen palette={colors.dark} onBack={() => router.back()} onStart={() => router.replace({ pathname: '/room/[mode]', params: { mode: 'room' } })} />;
}