import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import GoLiveScreen from '@/components/GoLiveScreen';
import colors from '@/constants/colors';
import { createBroadcast, getMyActiveBroadcast } from '@/services/api';
import { useAuth } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GoLiveRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkActive = async () => {
      try {
        const active = await getMyActiveBroadcast();
        if (active) {
          Alert.alert(
            'Active Broadcast Found',
            'You have an ongoing broadcast. Do you want to resume it?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Resume', onPress: () => router.replace({ pathname: '/room/[mode]', params: { mode: 'room', broadcastId: active._id, channelName: active.channelName, isBroadcaster: 'true' } }) }
            ]
          );
        }
      } catch (err) {
        console.log('No active broadcast or error checking');
      }
    };
    checkActive();
  }, [router]);

  const handleStart = async (title: string, category: string) => {
    const finalTitle = title.trim() || `${user?.displayName || user?.username || 'User'}'s live`;
    
    setIsLoading(true);
    try {
      const broadcast = await createBroadcast(finalTitle, category);
      await AsyncStorage.setItem('active-broadcast', broadcast._id);
      router.replace({ 
        pathname: '/room/[mode]', 
        params: { mode: 'room', broadcastId: broadcast._id, channelName: broadcast.channelName, isBroadcaster: 'true' } 
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start broadcast');
    } finally {
      setIsLoading(false);
    }
  };

  return <GoLiveScreen palette={colors.dark} onBack={() => router.back()} onStart={handleStart} isLoading={isLoading} />;
}