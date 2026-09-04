import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { Avatar, Icon } from './StreamZoneApp';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IncomingCall = {
  _id: string;
  caller: {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
  };
  type: 'voice' | 'video';
};

interface Props {
  call: IncomingCall | null;
  onAccept: (call: IncomingCall) => void;
  onReject: (call: IncomingCall) => void;
}

export function IncomingCallOverlay({ call, onAccept, onReject }: Props) {
  const insets = useSafeAreaInsets();

  if (!call) return null;

  return (
    <Animated.View 
      entering={FadeInUp.duration(400)} 
      exiting={FadeOutUp.duration(300)}
      style={[styles.container, { top: Math.max(insets.top, 10) }]}
    >
      <View style={styles.card}>
        <Avatar uri={call.caller.avatarUrl || 'https://i.pravatar.cc/150?u=' + call.caller._id} size={50} ring />
        <View style={styles.info}>
          <Text style={styles.name}>{call.caller.displayName || call.caller.username}</Text>
          <Text style={styles.type}>Incoming {call.type} call...</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.rejectBtn]} onPress={() => onReject(call)}>
            <Icon name="close" size={24} color="#fff" />
          </Pressable>
          <Pressable style={[styles.btn, styles.acceptBtn]} onPress={() => onAccept(call)}>
            <Icon name={call.type === 'video' ? 'videocam' : 'call'} size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.secondary,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.dark.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  type: {
    color: colors.dark.primary,
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#ff3b30',
  },
  acceptBtn: {
    backgroundColor: '#34c759',
  }
});
