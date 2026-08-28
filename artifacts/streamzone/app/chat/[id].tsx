import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatScreen } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';

export default function ChatRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen palette={colors.dark} conversationId={id ?? 'c1'} onBack={() => router.back()} />;
}