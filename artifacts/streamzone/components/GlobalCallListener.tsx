import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { socketService } from '@/services/socketService';
import { IncomingCallOverlay } from './IncomingCallOverlay';
import { answerCall, rejectCall } from '@/services/api';
import { Alert } from 'react-native';

export function GlobalCallListener() {
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  useEffect(() => {
    const handleIncoming = (callData: any) => {
      setIncomingCall(callData);
    };

    const handleCallCanceled = () => {
      setIncomingCall(null);
    };

    socketService.on('incomingCall', handleIncoming);
    socketService.on('callEnded', handleCallCanceled); // caller canceled before answer

    return () => {
      socketService.off('incomingCall', handleIncoming);
      socketService.off('callEnded', handleCallCanceled);
    };
  }, []);

  const handleAccept = async (call: any) => {
    try {
      await answerCall(call._id);
      setIncomingCall(null);
      router.push({ pathname: '/call/[id]', params: { id: call._id, isCaller: 'false' } });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not answer call');
      setIncomingCall(null);
    }
  };

  const handleReject = async (call: any) => {
    try {
      await rejectCall(call._id);
    } catch (err) {
      console.error(err);
    } finally {
      setIncomingCall(null);
    }
  };

  return (
    <IncomingCallOverlay 
      call={incomingCall} 
      onAccept={handleAccept} 
      onReject={handleReject} 
    />
  );
}
