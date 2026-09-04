import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid, Text, Pressable } from 'react-native';
import createAgoraRtcEngine, { ClientRoleType, ChannelProfileType, IRtcEngine, RtcSurfaceView } from 'react-native-agora';
import { getAgoraToken } from '@/services/api';
import { useStreamStore } from '@/store/useStreamStore';

const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || 'dummy_agora_app_id';

interface Props {
  broadcastId?: string;
  isBroadcaster?: boolean;
  channelName?: string;
  previewMode?: boolean;
  token?: string;
  uid?: number;
  role?: 'publisher' | 'subscriber';
}

export interface AgoraVideoViewRef {
  switchCamera: () => void;
  muteAudio: (muted: boolean) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  setBeautyEffect: (enabled: boolean, options: any) => void;
}

const AgoraVideoView = forwardRef<AgoraVideoViewRef, Props>(({ broadcastId, isBroadcaster, channelName, previewMode, token, uid, role }, ref) => {
  const engine = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraMuted, setIsCameraMuted] = useState(false);
  
  const beautyOptions = useStreamStore((state) => state.beautyOptions);

  const effectiveIsBroadcaster = isBroadcaster || role === 'publisher';

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ]);
        }

        engine.current = createAgoraRtcEngine();
        engine.current.initialize({ appId });
        
        if (beautyOptions.enabled) {
          engine.current.setBeautyEffectOptions(true, {
            lighteningContrastLevel: 1,
            lighteningLevel: beautyOptions.values['Whiten'] || 0.7,
            smoothnessLevel: beautyOptions.values['Smooth Skin'] || 0.5,
            rednessLevel: beautyOptions.values['Rosy'] || 0.1,
            sharpnessLevel: beautyOptions.values['Sharpness'] || 0.1,
          });
        }

        if (previewMode) {
          engine.current.enableVideo();
          engine.current.startPreview();
          if (isMounted) setJoined(true);
          return;
        }

        let tokenToUse = token;
        let uidToUse = uid ?? 0;
        let channelToUse = channelName;

        if (!tokenToUse) {
          if (!broadcastId || !channelName) return;
          const data = await getAgoraToken(broadcastId);
          tokenToUse = data.token;
          uidToUse = data.uid ?? 0;
          channelToUse = data.channelName || channelName;
        }

        if (!tokenToUse || !channelToUse) return;
        
        engine.current.registerEventHandler({
          onJoinChannelSuccess: () => {
            if (isMounted) setJoined(true);
          },
          onUserJoined: (_connection, joinedUid) => {
            if (isMounted) setRemoteUid(joinedUid);
          },
          onUserOffline: (_connection, offlineUid) => {
            if (isMounted) {
              setRemoteUid((prev) => (prev === offlineUid ? null : prev));
            }
          },
        });

        engine.current.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
        engine.current.setClientRole(
          effectiveIsBroadcaster ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
        );
        engine.current.enableVideo();
        engine.current.enableAudio();

        if (effectiveIsBroadcaster) {
          engine.current.startPreview();
        }

        engine.current.joinChannel(tokenToUse, channelToUse, uidToUse, {
          clientRoleType: effectiveIsBroadcaster ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
        });

      } catch (e: any) {
        console.warn('Agora init failed', e);
        if (isMounted) setErrorMsg(e.message || 'Failed to initialize video stream');
      }
    };

    init();

    return () => {
      isMounted = false;
      if (engine.current) {
        engine.current.leaveChannel();
        engine.current.release();
        engine.current = null;
      }
    };
  }, [broadcastId, isBroadcaster, channelName, previewMode, token, uid, role]);

  useImperativeHandle(ref, () => ({
    switchCamera: () => {
      if (engine.current) {
        try {
          const res = engine.current.switchCamera();
          console.log('[AgoraVideoView] switchCamera returned:', res);
        } catch (err) {
          console.error('[AgoraVideoView] switchCamera error:', err);
        }
      } else {
        console.warn('[AgoraVideoView] switchCamera called but engine.current is null');
      }
    },
    muteAudio: (muted: boolean) => {
      if (engine.current) {
        engine.current.muteLocalAudioStream(muted);
        setIsMicMuted(muted);
      }
    },
    toggleMic: () => {
      if (engine.current) {
        const next = !isMicMuted;
        engine.current.muteLocalAudioStream(next);
        setIsMicMuted(next);
      }
    },
    toggleCamera: () => {
      if (engine.current) {
        const next = !isCameraMuted;
        engine.current.muteLocalVideoStream(next);
        setIsCameraMuted(next);
      }
    },
    setBeautyEffect: (enabled: boolean, options: any) => {
      if (engine.current) {
        engine.current.setBeautyEffectOptions(enabled, options);
      }
    }
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {previewMode && joined ? (
        <RtcSurfaceView canvas={{ uid: 0 }} style={StyleSheet.absoluteFill} />
      ) : remoteUid && joined ? (
        <>
          {/* Main video stream */}
          <RtcSurfaceView
            canvas={{ uid: isSwapped ? 0 : remoteUid }}
            style={StyleSheet.absoluteFill}
          />
          {/* Picture-in-Picture floating view */}
          <Pressable
            onPress={() => setIsSwapped(!isSwapped)}
            style={styles.pipContainer}
          >
            <RtcSurfaceView
              canvas={{ uid: isSwapped ? remoteUid : 0 }}
              style={styles.pipView}
              zOrderMediaOverlay={true}
            />
          </Pressable>
        </>
      ) : effectiveIsBroadcaster && joined ? (
        <RtcSurfaceView canvas={{ uid: 0 }} style={StyleSheet.absoluteFill} />
      ) : errorMsg ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#ff4444', textAlign: 'center', padding: 20 }}>{errorMsg}</Text>
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', opacity: 0.7 }}>Initializing camera...</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 100,
  },
  pipView: {
    width: '100%',
    height: '100%',
  },
});

export { AgoraVideoView };
export default AgoraVideoView;
