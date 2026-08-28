import React from 'react';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { BottomNav, FeedScreen } from '@/components/StreamZoneApp';
import { useStreamStore } from '@/store/useStreamStore';

export default function FeedRoute() {
  const router = useRouter();
  const activeTab = useStreamStore((state) => state.activeTab);
  const goRoom = (mode: 'room' | 'pk' | 'multi' | 'voice') => router.push({ pathname: '/room/[mode]', params: { mode } });
  return <><FeedScreen palette={colors.dark} onBack={() => router.replace('/(tabs)')} onOpenRoom={goRoom} /><BottomNav activeTab={activeTab} palette={colors.dark} onTab={(tab) => router.replace(`/(tabs)/${tab === 'home' ? '' : tab}` as never)} onGoLive={() => router.push('/go-live')} /></>;
}