import React from 'react';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { BottomNav, ProfileScreen } from '@/components/StreamZoneApp';
import { useStreamStore } from '@/store/useStreamStore';

export default function ProfileRoute() {
  const router = useRouter();
  const activeTab = useStreamStore((state) => state.activeTab);
  return <><ProfileScreen palette={colors.dark} onNavigate={(screen) => router.push(`/${screen}` as never)} onTheme={() => {}} /><BottomNav activeTab={activeTab} palette={colors.dark} onTab={(tab) => router.replace(`/(tabs)/${tab === 'home' ? '' : tab}` as never)} onGoLive={() => router.push('/go-live')} /></>;
}