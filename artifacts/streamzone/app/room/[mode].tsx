import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LiveRoom } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function RoomRoute() {
  const router = useRouter();
  const { mode, broadcastId, channelName, isBroadcaster } = useLocalSearchParams<{ mode: 'room' | 'pk' | 'multi' | 'voice'; broadcastId: string; channelName: string; isBroadcaster: string }>();
  return <LiveRoom palette={colors.dark} mode={mode ?? 'room'} broadcastId={broadcastId} channelName={channelName} isBroadcaster={isBroadcaster === 'true'} onClose={() => router.back()} />;
}