import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Icon, Avatar, Header } from './StreamZoneApp';
import { ThemeColors } from '@/constants/colors';
import { api, initiateCall } from '@/services/api';
import { useAuth } from '@/store/authStore';
import { socketService } from '@/services/socketService';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

export function MessagesScreen({ palette, onOpenChat }: { palette: ThemeColors; onOpenChat: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Refresh when screen is focused or socket events happen
    socketService.on('newDirectMessage', fetchConversations);
    return () => {
      socketService.off('newDirectMessage', fetchConversations);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}>
        <View style={[styles.messageHeader, { paddingTop: insets.top + 8 }]}>
          <Text style={[styles.pageTitle, { color: palette.primary }]}>Messages</Text>
          <View style={styles.topActions}>
            <Pressable style={[styles.roundAction, { backgroundColor: palette.secondary }]}>
              <Icon name="trash" size={18} color={palette.primary} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 50 }} />
        ) : conversations.length === 0 ? (
          <Text style={{ textAlign: 'center', color: palette.mutedText, marginTop: 50 }}>No messages yet.</Text>
        ) : (
          conversations.map((conv) => {
            const otherUser = conv.participants.find((p: any) => p._id !== user?._id);
            const unreadCount = conv.unreadCounts?.[user?._id || ''] || 0;
            return (
              <Pressable 
                key={conv._id} 
                onPress={() => onOpenChat(conv._id)} 
                style={({ pressed }) => [styles.conversation, { backgroundColor: palette.card }, pressed && styles.pressed]}
              >
                <Avatar uri={otherUser?.avatarUrl || 'https://via.placeholder.com/150'} size={48} ring />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.conversationName, { color: palette.foreground }]}>
                    {otherUser?.displayName || otherUser?.username || 'User'} {otherUser?.isOnline && <Text style={{ color: palette.gold }}>●</Text>}
                  </Text>
                  <Text style={[styles.conversationMessage, { color: palette.mutedText }]} numberOfLines={1}>
                    {conv.lastMessage?.text || (conv.lastMessage?.type ? `Sent an ${conv.lastMessage.type}` : 'No messages yet')}
                  </Text>
                </View>
                <View style={styles.conversationRight}>
                  {unreadCount > 0 && (
                    <View style={[styles.unread, { backgroundColor: palette.primary }]}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}



export function AudioPlayer({ uri, palette }: { uri: string; palette: ThemeColors }) {
  const [barWidth, setBarWidth] = useState(0);
  
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  
  const isPlaying = status.playing;
  const position = status.currentTime * 1000;
  const duration = status.duration * 1000;

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        if (position >= duration - 100 && duration > 0) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (e) {
      console.log('Error toggling play', e);
    }
  };

  const handleSeekBarPress = (event: any) => {
    if (barWidth === 0 || duration <= 0) return;
    try {
      const { locationX } = event.nativeEvent;
      const pct = Math.max(0, Math.min(1, locationX / barWidth));
      const newPos = pct * (duration / 1000);
      player.seekTo(newPos);
    } catch (e) {
      console.log('Error seeking', e);
    }
  };

  const formatAudioTime = (millis: number) => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSecs = Math.floor(millis / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, minWidth: 220, paddingHorizontal: 4 }}>
      <Pressable onPress={togglePlay} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={isPlaying ? "pause" : "play"} size={20} color={palette.primaryForeground} />
      </Pressable>
      <Pressable 
        onPress={handleSeekBarPress} 
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={{ flex: 1, height: 20, justifyContent: 'center' }}
      >
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', backgroundColor: palette.primaryForeground, width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }} />
        </View>
      </Pressable>
      <Text style={{ color: palette.primaryForeground, fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'right' }}>
        {isPlaying ? `${formatAudioTime(position)} / ${formatAudioTime(duration)}` : formatAudioTime(duration)}
      </Text>
    </View>
  );
}

export function ChatScreen({ palette, onBack, conversationId }: { palette: ThemeColors; onBack: () => void; conversationId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiver, setReceiver] = useState<any>(null);
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string; type: 'video' | 'image' } | null>(null);
  const [calling, setCalling] = useState(false);
  
  // Audio recording
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingStatus, setRecordingStatus] = useState<'idle'|'recording'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversation = async () => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      const conv = res.data;
      const otherUser = conv.participants?.find((p: any) => p._id !== user?._id);
      if (otherUser) {
        setReceiver(otherUser);
      }
    } catch (e) {
      console.error('Error fetching conversation', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 150);
    }
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages();
    
    socketService.connect().then(() => {
      socketService.joinConversation(conversationId);
    });
    
    const onNewMessage = (msg: any) => {
      const msgConversationId = msg.conversation?._id || msg.conversation?.toString() || msg.conversation;
      if (msgConversationId === conversationId) {
        setMessages((prev) => {
          const existingIdx = prev.findIndex(
            (m) =>
              m._id === msg._id ||
              (m._tempId && m.text && m.text === msg.text) ||
              (m._tempId && m.mediaUrl && m.mediaUrl === msg.mediaUrl),
          );
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = msg;
            return updated;
          }
          return [...prev, msg];
        });
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };
    
    socketService.on('newDirectMessage', onNewMessage);
    
    return () => {
      socketService.leaveConversation(conversationId);
      socketService.off('newDirectMessage', onNewMessage);
    };
  }, [conversationId]);

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      _tempId: tempId,
      conversation: conversationId,
      sender: user,
      type: 'text',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      await socketService.sendDirectMessage({
        conversationId,
        type: 'text',
        text,
      });
    } catch (e) {
      console.error('Failed to send text message', e);
    }
  };

  const uploadFileWithXHR = async (uri: string, name: string, type: string): Promise<string> => {
    const token = await AsyncStorage.getItem('livewave-access-token');
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${baseUrl}/storage/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.url);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          console.error('Upload failed with status', xhr.status, xhr.responseText);
          reject(new Error(`Server returned status ${xhr.status}`));
        }
      };
      xhr.onerror = (e) => {
        console.error('Upload XHR error', e);
        reject(new Error('Network request failed'));
      };
      const formData = new FormData();
      formData.append('file', {
        uri,
        name,
        type,
      } as any);
      xhr.send(formData);
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingMedia(true);
      try {
        const mediaUrl = await uploadFileWithXHR(
          asset.uri,
          asset.uri.split('/').pop() || 'upload.jpg',
          asset.type === 'video' ? 'video/mp4' : 'image/jpeg'
        );

        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
          _id: tempId,
          _tempId: tempId,
          conversation: conversationId,
          sender: user,
          type: asset.type === 'video' ? 'video' : 'image',
          mediaUrl,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

        await socketService.sendDirectMessage({
          conversationId,
          type: asset.type === 'video' ? 'video' : 'image',
          mediaUrl,
        });
      } catch (e: any) {
        console.error('Media upload failed:', e.message);
        Alert.alert('Upload failed', 'Could not upload media');
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  const handleSendMedia = async (uri: string, type: 'audio' | 'image' | 'video') => {
      setUploadingMedia(true);
      try {
        const mediaUrl = await uploadFileWithXHR(uri, `${type}.m4a`, 'audio/m4a');
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
          _id: tempId,
          _tempId: tempId,
          conversation: conversationId,
          sender: user,
          type,
          mediaUrl,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
        await socketService.sendDirectMessage({
          conversationId,
          type,
          mediaUrl,
        });
      } catch (e: any) {
        console.error('Media upload failed:', e.message);
        Alert.alert('Upload failed', 'Could not upload media');
      } finally {
        setUploadingMedia(false);
      }
  }

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') return;

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingStatus('recording');
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndSend = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingStatus('idle');
    setRecordingDuration(0);
    
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        await handleSendMedia(uri, 'audio');
      }
    } catch (err: any) {
      console.error('Failed to stop/upload recording', err.message);
      Alert.alert('Upload failed', 'Could not send audio message');
    }
  };

  const cancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingStatus('idle');
    setRecordingDuration(0);

    try {
      await recorder.stop();
    } catch (e) {}
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    if (!receiver?._id || calling) return;
    setCalling(true);
    try {
      const callData = await initiateCall(receiver._id, type);
      router.push({ pathname: '/call/[id]', params: { id: callData._id, isCaller: 'true' } });
    } catch (err: any) {
      console.error('Call failed', err);
      Alert.alert('Call Failed', err.response?.data?.message || 'Could not initiate call');
    } finally {
      setCalling(false);
    }
  };

  const handleSendGift = async (gift: any) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      _tempId: tempId,
      conversation: conversationId,
      sender: user,
      type: 'gift',
      giftData: gift,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      await socketService.sendDirectMessage({
        conversationId,
        type: 'gift',
        giftData: gift,
      });
    } catch (e) {
      console.error('Failed to send gift', e);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: palette.background }} 
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.chatHeader, { backgroundColor: palette.card, borderBottomColor: palette.border, paddingTop: insets.top + 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ padding: 4 }}>
            <Icon name="chevron-back" size={24} color={palette.foreground} />
          </Pressable>
          {receiver && (
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => router.push(`/user-profile/${receiver._id}`)}>
              <Avatar uri={receiver.avatarUrl || 'https://via.placeholder.com/150'} size={36} ring />
              <View>
                <Text style={{ color: palette.foreground, fontSize: 16, fontWeight: '700' }}>{receiver.displayName}</Text>
                {receiver.isOnline && <Text style={{ color: palette.success, fontSize: 12 }}>Online</Text>}
              </View>
            </Pressable>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable onPress={() => handleStartCall('voice')} disabled={calling} style={{ opacity: calling ? 0.5 : 1 }}>
            <Icon name="call" size={22} color={palette.primary} />
          </Pressable>
          <Pressable onPress={() => handleStartCall('video')} disabled={calling} style={{ opacity: calling ? 0.5 : 1 }}>
            <Icon name="videocam" size={22} color={palette.primary} />
          </Pressable>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollViewRef} 
        style={{ flex: 1 }}
        contentContainerStyle={styles.chatContent}
        onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {loading ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />
        ) : (
          messages.map((item) => {
            const isMine = item.sender?._id === user?._id || item.sender === user?._id;
            const isMedia = item.type === 'image' || item.type === 'video';
            return (
              <View key={item._id} style={[styles.chatBubbleRow, isMine && { justifyContent: 'flex-end' }]}>
                <View style={[
                  styles.chatBubble, 
                  { backgroundColor: isMine ? palette.primary : palette.card },
                  isMedia && { padding: 4, borderRadius: 16 }
                ]}>
                  {item.type === 'text' && <Text style={styles.chatBubbleText}>{item.text}</Text>}
                  
                  {item.type === 'image' && (
                    <Pressable onPress={() => setFullScreenMedia({ url: item.mediaUrl, type: 'image' })}>
                      <Image 
                        source={{ uri: item.mediaUrl }} 
                        style={styles.chatPhoto} 
                        onLoad={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                      />
                    </Pressable>
                  )}
                  
                  {item.type === 'video' && (
                    <Pressable onPress={() => setFullScreenMedia({ url: item.mediaUrl, type: 'video' })}>
                      <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                        <View style={{ width: 220, height: 220, borderRadius: 12, backgroundColor: '#000000' }} />
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                            <Icon name="play" size={24} color="#fff" style={{ marginLeft: 3 }} />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  )}
                  
                  {item.type === 'audio' && (
                    <AudioPlayer uri={item.mediaUrl} palette={palette} />
                  )}
                  
                  {item.type === 'gift' && (
                    <View style={{ alignItems: 'center', padding: 5 }}>
                      <Text style={styles.chatBubbleText}>Sent {item.giftData?.name || 'a Gift'}</Text>
                      {item.giftData?.icon ? (
                        <Image source={{ uri: item.giftData.icon }} style={{ width: 60, height: 60, marginTop: 8 }} resizeMode="contain" />
                      ) : (
                        <Icon name="gift" size={40} color={palette.gold || '#FFD700'} style={{ marginTop: 8 }} />
                      )}
                    </View>
                  )}
                  
                  {item.type === 'call' && (() => {
                    const isVideo = item.text?.toLowerCase().includes('video') || item.callType === 'video';
                    return (
                      <Pressable 
                        onPress={() => handleStartCall(isVideo ? 'video' : 'voice')}
                        style={styles.callMessageCard}
                      >
                        <View style={[
                          styles.callIconBadge, 
                          { backgroundColor: isMine ? 'rgba(255, 255, 255, 0.22)' : (isVideo ? 'rgba(154, 53, 244, 0.2)' : 'rgba(244, 28, 151, 0.2)') }
                        ]}>
                          <Icon 
                            name={isVideo ? "videocam" : "call"} 
                            size={20} 
                            color={isMine ? "#ffffff" : (isVideo ? palette.accent : palette.primary)} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.callMessageTitle, !isMine && { color: palette.foreground }]}>
                            {item.text || (isVideo ? 'Video Call' : 'Voice Call')}
                          </Text>
                          <Text style={[styles.callMessageSubtitle, !isMine && { color: palette.mutedForeground }]}>
                            {isVideo ? 'Tap to start video call' : 'Tap to call back'}
                          </Text>
                        </View>
                        <Icon name="chevron-forward" size={16} color={isMine ? "rgba(255,255,255,0.85)" : palette.mutedForeground} />
                      </Pressable>
                    );
                  })()}
                  
                  <Text style={[styles.messageTime, isMine ? { color: 'rgba(255,255,255,0.7)' } : { color: palette.mutedForeground }]}>
                    {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[
        styles.chatInputRow, 
        { 
          backgroundColor: palette.card, 
          borderTopColor: palette.border,
          paddingBottom: Math.max(insets.bottom, 10),
        }
      ]}>
        {recordingStatus === 'recording' ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.recordingDot, { backgroundColor: palette.destructive }]} />
              <Text style={{ color: palette.foreground, fontSize: 16 }}>{formatTime(recordingDuration)}</Text>
            </View>
            <Pressable onPress={cancelRecording} style={{ padding: 5 }}>
              <Text style={{ color: palette.destructive, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput 
              value={inputText} 
              onChangeText={setInputText} 
              placeholder="Say something..." 
              placeholderTextColor={palette.mutedForeground} 
              style={[styles.chatInput, { color: palette.foreground }]} 
            />
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={palette.primary} style={{ marginRight: 15 }} />
            ) : (
              <>
                <Pressable onPress={handlePickImage} style={{ marginRight: 10 }}>
                  <Icon name="image" size={24} color={palette.mutedForeground} />
                </Pressable>
                
                <Pressable 
                  onPress={() => {
                    handleSendGift({ id: 'g1', name: 'Rose', price: 10, icon: 'https://cdn-icons-png.flaticon.com/512/869/869018.png' });
                  }} 
                  style={{ marginRight: 10 }}
                >
                  <Icon name="gift" size={24} color={palette.mutedForeground} />
                </Pressable>
              </>
            )}
          </>
        )}

        <Pressable 
          onPress={recordingStatus === 'recording' ? stopRecordingAndSend : startRecording} 
          style={({ pressed }) => [{ marginRight: 10, opacity: pressed ? 0.5 : 1 }, recordingStatus === 'recording' && { backgroundColor: palette.destructive, borderRadius: 20, padding: 5 }]}
        >
          <Icon name={recordingStatus === 'recording' ? "send" : "mic"} size={24} color={recordingStatus === 'recording' ? '#fff' : palette.mutedForeground} />
        </Pressable>

        {recordingStatus !== 'recording' && (
          <Pressable 
            onPress={handleSendText} 
            style={[styles.sendButton, { backgroundColor: palette.primary }]}
          >
            <Icon name="paper-plane" size={17} color="#fff" />
          </Pressable>
        )}
      </View>

      <Modal visible={!!fullScreenMedia} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalClose} onPress={() => setFullScreenMedia(null)}>
            <Icon name="close" size={32} color="#fff" />
          </Pressable>
          {fullScreenMedia?.type === 'image' && (
            <Image source={{ uri: fullScreenMedia.url }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
          {fullScreenMedia?.type === 'video' && (
            <FullScreenVideo url={fullScreenMedia.url} />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  conversation: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: 16 },
  conversationName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  conversationMessage: { fontSize: 13, lineHeight: 18 },
  conversationRight: { alignItems: 'flex-end', gap: 6 },
  unread: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  conversationTime: { fontSize: 11 },
  pressed: { opacity: 0.8 },
  chatContent: { padding: 16, paddingBottom: 20 },
  chatBubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  chatBubble: { padding: 12, borderRadius: 16, maxWidth: '75%' },
  chatBubbleText: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1 },
  chatInput: { flex: 1, height: 40, fontSize: 15, paddingHorizontal: 12 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chatPhoto: { width: 200, height: 200, borderRadius: 12 },
  callIcon: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  recordingDot: { width: 10, height: 10, borderRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullScreenImage: { width: '100%', height: '80%' },
  callMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 200,
  },
  callIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callMessageTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  callMessageSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
});

function FullScreenVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, player => {
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.fullScreenImage}
      contentFit="contain"
      allowsPictureInPicture
    />
  );
}
