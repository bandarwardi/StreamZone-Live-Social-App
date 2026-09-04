import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { BottomNav, HomeScreen as DiscoverScreen } from '@/components/StreamZoneApp';
import { useStreamStore } from '@/store/useStreamStore';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyActiveBroadcast } from '@/services/api';

export default function HomeRoute() {
  const router = useRouter();
  const activeTab = useStreamStore((state) => state.activeTab);

  useEffect(() => {
    const checkActiveBroadcast = async () => {
      try {
        const savedId = await AsyncStorage.getItem('active-broadcast');
        const active = await getMyActiveBroadcast();
        
        if (active) {
          router.replace({ 
            pathname: '/room/[mode]', 
            params: { mode: 'room', broadcastId: active._id, channelName: active.channelName, isBroadcaster: 'true' } 
          });
        } else if (savedId) {
          Alert.alert('Broadcast Ended', 'تم إيقاف البث لعدم النشاط');
          await AsyncStorage.removeItem('active-broadcast');
        }
      } catch (err) {
        console.log('Error checking active broadcast', err);
      }
    };
    checkActiveBroadcast();
  }, [router]);

  const goRoom = (mode: 'room' | 'pk' | 'multi' | 'voice') => router.push({ pathname: '/room/[mode]', params: { mode } });
  return <><DiscoverScreen palette={colors.dark} onNavigate={(screen: string) => router.push(`/${screen}` as never)} onOpenRoom={goRoom} /><BottomNav activeTab={activeTab} palette={colors.dark} onTab={(tab) => router.replace(`/(tabs)/${tab === 'home' ? '' : tab}` as never)} onGoLive={() => router.push('/go-live')} /></>;
}
