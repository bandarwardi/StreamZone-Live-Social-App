import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallStore } from '@/store/useCallStore';
import { useAuth } from '@/store/authStore';
import { Icon, Avatar } from '@/components/StreamZoneApp';
import colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ActiveCallBar() {
  const { activeCallId, callData, duration, incrementDuration } = useCallStore();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeCallId) {
      interval = setInterval(() => {
        incrementDuration();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCallId]);

  if (!activeCallId || !callData) return null;

  const isCaller = callData.caller?._id === user?._id;
  const otherUser = isCaller ? callData.callee : callData.caller;

  const formatDuration = () => {
    const m = Math.floor(duration / 60).toString().padStart(2, '0');
    const s = (duration % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Pressable 
      onPress={() => router.push(`/call/${activeCallId}?isCaller=${isCaller}`)}
      style={[styles.container, { top: insets.top + 10 }]}
    >
      <View style={styles.content}>
        <View style={styles.pulseIndicator} />
        <Avatar uri={otherUser?.avatarUrl || 'https://i.pravatar.cc/150'} size={32} ring={false} />
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>{otherUser?.displayName || 'User'}</Text>
          <Text style={styles.duration}>Tap to return to call • {formatDuration()}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon name="call" size={20} color={colors.dark.success} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.success,
    shadowColor: colors.dark.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark.success,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    color: colors.dark.foreground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  duration: {
    color: colors.dark.success,
    fontSize: 12,
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
