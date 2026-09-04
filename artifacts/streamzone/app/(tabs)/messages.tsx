import React from 'react';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { BottomNav } from '@/components/StreamZoneApp';
import { MessagesScreen } from '@/components/DirectMessages';
import { useStreamStore } from '@/store/useStreamStore';

export default function MessagesRoute() {
  const router = useRouter();
  const activeTab = useStreamStore((state) => state.activeTab);
  return <><MessagesScreen palette={colors.dark} onOpenChat={(id) => router.push({ pathname: '/chat/[id]', params: { id } })} /><BottomNav activeTab={activeTab} palette={colors.dark} onTab={(tab) => router.replace(`/(tabs)/${tab === 'home' ? '' : tab}` as never)} onGoLive={() => router.push('/go-live')} /></>;
}