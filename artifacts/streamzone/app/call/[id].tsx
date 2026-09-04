import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCallToken, endCall, api } from '@/services/api';
import { socketService } from '@/services/socketService';
import colors from '@/constants/colors';
import { Avatar, Icon } from '@/components/StreamZoneApp';
import AgoraVideoView, { AgoraVideoViewRef } from '@/components/AgoraVideoView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallStore } from '@/store/useCallStore';
import { useAudioPlayer } from 'expo-audio';

export default function CallRoute() {
  const { id, isCaller } = useLocalSearchParams<{ id: string; isCaller: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const callStore = useCallStore();
  
  const [status, setStatus] = useState<'ringing' | 'active' | 'ended'>(isCaller === 'true' ? 'ringing' : 'active');
  const [callData, setCallData] = useState<any>(null);
  const [agoraToken, setAgoraToken] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Agora setup
  const cameraRef = useRef<AgoraVideoViewRef>(null);
  const [muted, setMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);

  // Ringtone playback during ringing
  const ringtonePlayer = useAudioPlayer(require('@/assets/sounds/ringing.wav'));

  useEffect(() => {
    if (status === 'ringing') {
      ringtonePlayer.loop = true;
      ringtonePlayer.volume = 0.8;
      ringtonePlayer.play();
    } else {
      ringtonePlayer.pause();
    }
  }, [status, ringtonePlayer]);

  // Local timer for active call
  useEffect(() => {
    let timer: any = null;
    if (status === 'active') {
      timer = setInterval(() => {
        setCallDuration((prev) => {
          const next = prev + 1;
          callStore.incrementDuration();
          return next;
        });
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  useEffect(() => {
    if (!id || id === 'demo' || (typeof id === 'string' && id.length !== 24)) {
      Alert.alert('Invalid Call', 'Call cannot be found or has expired', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }

    socketService.ensureConnected();

    const handleAnswered = async (data: any) => {
      if (data.callId === id) {
        setStatus('active');
        fetchToken();
      }
    };
    
    const handleRejected = (data: any) => {
      if (data.callId === id) {
        setStatus('ended');
        Alert.alert('Call Rejected', 'The user rejected your call', [{ text: 'OK', onPress: () => router.back() }]);
      }
    };

    const handleEnded = (data: any) => {
      if (data.callId === id) {
        setStatus('ended');
        Alert.alert('Call Ended', 'The call was ended', [{ text: 'OK', onPress: () => router.back() }]);
      }
    };

    socketService.on('callAnswered', handleAnswered);
    socketService.on('callRejected', handleRejected);
    socketService.on('callEnded', handleEnded);

    if (isCaller === 'false') {
      fetchToken();
    }
    
    // Fetch call details
    api.get(`/calls/${id}`).then(res => {
      setCallData(res.data);
      if (res.data.status === 'active') {
        setStatus('active');
        fetchToken();
      }
    }).catch((err) => {
      console.error('Fetch call details error:', err);
    });

    return () => {
      socketService.off('callAnswered', handleAnswered);
      socketService.off('callRejected', handleRejected);
      socketService.off('callEnded', handleEnded);
    };
  }, [id, isCaller]);

  const fetchToken = async () => {
    try {
      const data = await getCallToken(id as string);
      setAgoraToken(data);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', 'Failed to connect call');
    }
  };

  useEffect(() => {
    if (status === 'active' && agoraToken && callData) {
      callStore.setActiveCall(id as string, agoraToken, callData);
    }
    
    if (status === 'ended') {
      if (callStore.activeCallId === id) {
        callStore.clearActiveCall();
      }
    }
  }, [status, agoraToken, callData]);

  const formatDuration = () => {
    const m = Math.floor(callDuration / 60).toString().padStart(2, '0');
    const s = (callDuration % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = async () => {
    try {
      await endCall(id as string);
    } catch (err) {
      console.error(err);
    } finally {
      setStatus('ended');
      callStore.clearActiveCall();
      router.back();
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    cameraRef.current?.toggleMic();
  };

  const toggleVideo = () => {
    setVideoDisabled(!videoDisabled);
    cameraRef.current?.toggleCamera();
  };

  const otherUser = callData ? (isCaller === 'true' ? callData.callee : callData.caller) : null;
  const isVideoCall = callData?.type === 'video';

  return (
    <View style={styles.container}>
      {status === 'ringing' ? (
        <View style={styles.ringingContainer}>
          {/* If video call, open camera preview in background right away */}
          {isVideoCall && (
            <View style={StyleSheet.absoluteFill}>
              <AgoraVideoView ref={cameraRef} previewMode={true} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
            </View>
          )}

          <View style={[styles.callerInfo, { paddingTop: insets.top + 60 }]}>
            <Avatar uri={otherUser?.avatarUrl || 'https://via.placeholder.com/150'} size={120} ring />
            <Text style={styles.callerName}>{otherUser?.displayName || otherUser?.username || 'Connecting...'}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.statusText}>
                {isCaller === 'true' ? 'Calling...' : 'Incoming Call...'}
              </Text>
            </View>
            <Text style={styles.callTypeSubtitle}>
              {isVideoCall ? '🎥 Video Call' : '📞 Voice Call'}
            </Text>
          </View>

          <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 30 }]}>
            {isVideoCall && (
              <Pressable style={styles.controlBtn} onPress={() => cameraRef.current?.switchCamera()}>
                <Icon name="camera-reverse" size={24} color="#fff" />
              </Pressable>
            )}
            <Pressable style={[styles.controlBtn, styles.endBtn]} onPress={handleEndCall}>
              <Icon name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>
          </View>
        </View>
      ) : status === 'active' && agoraToken ? (
        <View style={styles.activeContainer}>
          {isVideoCall ? (
            <AgoraVideoView 
              ref={cameraRef}
              channelName={agoraToken.channelName} 
              token={agoraToken.token} 
              uid={agoraToken.uid} 
              role="publisher"
            />
          ) : (
            // Voice call elegant audio interface
            <View style={styles.voiceActiveView}>
              <Avatar uri={otherUser?.avatarUrl || 'https://via.placeholder.com/150'} size={140} ring />
              <Text style={[styles.callerName, { marginTop: 24 }]}>{otherUser?.displayName || otherUser?.username || 'User'}</Text>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          )}
          
          {/* Active Overlay Header & Duration */}
          <View style={[styles.activeOverlay, { paddingTop: insets.top + 16 }]}>
            <View style={styles.callHeader}>
              <View style={styles.timerBadge}>
                <View style={styles.timerDot} />
                <Text style={styles.duration}>{formatDuration()}</Text>
              </View>
              {!isVideoCall && (
                <Text style={styles.voiceHeaderTitle}>{otherUser?.displayName || 'Voice Call'}</Text>
              )}
            </View>
            
            {/* Bottom Call Controls */}
            <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 25 }]}>
              {isVideoCall && (
                <Pressable style={styles.controlBtn} onPress={() => cameraRef.current?.switchCamera()}>
                  <Icon name="camera-reverse" size={24} color="#fff" />
                </Pressable>
              )}
              
              <Pressable style={[styles.controlBtn, muted && styles.controlBtnActive]} onPress={toggleMute}>
                <Icon name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
              </Pressable>
              
              {isVideoCall && (
                <Pressable style={[styles.controlBtn, videoDisabled && styles.controlBtnActive]} onPress={toggleVideo}>
                  <Icon name={videoDisabled ? "videocam-off" : "videocam"} size={24} color="#fff" />
                </Pressable>
              )}
              
              <Pressable style={[styles.controlBtn, styles.endBtn]} onPress={handleEndCall}>
                <Icon name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.ringingContainer}>
          <View style={[styles.callerInfo, { paddingTop: insets.top + 100 }]}>
            <Avatar uri={otherUser?.avatarUrl || 'https://via.placeholder.com/150'} size={100} ring />
            <Text style={[styles.statusText, { marginTop: 24, fontSize: 18 }]}>Connecting call...</Text>
          </View>
          <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 30 }]}>
            <Pressable style={[styles.controlBtn, styles.endBtn]} onPress={handleEndCall}>
              <Icon name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  ringingContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callerInfo: {
    alignItems: 'center',
  },
  callerName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  callTypeSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  activeContainer: {
    flex: 1,
  },
  voiceActiveView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0c20',
  },
  connectedText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    pointerEvents: 'box-none',
  },
  callHeader: {
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  duration: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  voiceHeaderTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 6,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
  },
  controlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: colors.dark.primary,
  },
  endBtn: {
    backgroundColor: '#ff3b30',
    width: 66,
    height: 66,
    borderRadius: 33,
    elevation: 4,
  },
});
