import React from 'react';
import { useRouter } from 'expo-router';
import { WalletScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function WalletRoute() {
  const router = useRouter();
  return <WalletScreen palette={colors.dark} onBack={() => router.back()} onNavigate={(screen) => router.push(`/${screen}` as never)} />;
}