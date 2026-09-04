import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Header, Avatar, Icon, PillButton } from '@/components/StreamZoneApp';
import { useAuth } from '@/store/authStore';
import { getUserProfile, getFollowStatus, followUser, unfollowUser, initiateCall, startConversation } from '@/services/api';

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    Promise.all([
      getUserProfile(id as string),
      getFollowStatus(id as string).catch(() => ({ isFollowing: false }))
    ])
    .then(([profileData, followData]) => {
      setProfile(profileData);
      setIsFollowing(followData.isFollowing);
    })
    .catch(err => {
      console.error(err);
      Alert.alert('Error', 'Could not load profile');
    })
    .finally(() => setLoading(false));
  }, [id]);

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(id as string);
        setIsFollowing(false);
        setProfile((prev: any) => ({ ...prev, followerCount: Math.max(0, prev.followerCount - 1) }));
      } else {
        await followUser(id as string);
        setIsFollowing(true);
        setProfile((prev: any) => ({ ...prev, followerCount: prev.followerCount + 1 }));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleMessage = async () => {
    try {
      const conv = await startConversation(id as string);
      router.push({ pathname: '/chat/[id]', params: { id: conv._id } });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  const handleCall = async (type: 'voice' | 'video') => {
    try {
      const callData = await initiateCall(id as string, type);
      // Go to call screen with ringing state
      router.push({ pathname: '/call/[id]', params: { id: callData._id, isCaller: 'true' } });
    } catch (error: any) {
      Alert.alert('Call Failed', error.response?.data?.message || 'Could not initiate call');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.dark.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Header title="Profile" palette={colors.dark} onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.dark.mutedText }}>User not found</Text>
        </View>
      </View>
    );
  }

  const isSelf = currentUser?._id === id;

  return (
    <View style={styles.container}>
      <Header title={profile.username || 'Profile'} palette={colors.dark} onBack={() => router.back()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Avatar uri={profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile._id} size={90} ring />
          <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
          
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}
        </View>

        {!isSelf && (
          <View style={styles.actionsContainer}>
            <View style={styles.mainActions}>
              <Pressable 
                style={[styles.actionBtn, isFollowing ? styles.btnSecondary : styles.btnPrimary]} 
                onPress={handleToggleFollow}
              >
                <Icon name={isFollowing ? 'checkmark' : 'person-add'} size={20} color={colors.dark.foreground} />
                <Text style={styles.actionBtnText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </Pressable>
              
              <Pressable style={[styles.actionBtn, styles.btnSecondary]} onPress={handleMessage}>
                <Icon name="chatbubble-ellipses" size={20} color={colors.dark.foreground} />
                <Text style={styles.actionBtnText}>Message</Text>
              </Pressable>
            </View>
            
            <View style={styles.callActions}>
              <Pressable style={styles.callBtn} onPress={() => handleCall('voice')}>
                <Icon name="call" size={24} color={colors.dark.primary} />
              </Pressable>
              <Pressable style={styles.callBtn} onPress={() => handleCall('video')}>
                <Icon name="videocam" size={24} color={colors.dark.primary} />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingBottom: 24,
  },
  displayName: {
    color: colors.dark.foreground,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  username: {
    color: colors.dark.mutedForeground,
    fontSize: 15,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: colors.dark.secondary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  statBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.dark.border,
    marginHorizontal: 20,
  },
  statNumber: {
    color: colors.dark.foreground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.dark.mutedForeground,
    fontSize: 13,
    marginTop: 4,
  },
  bio: {
    color: colors.dark.foreground,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  actionsContainer: {
    padding: 20,
  },
  mainActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: colors.dark.primary,
  },
  btnSecondary: {
    backgroundColor: colors.dark.secondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  actionBtnText: {
    color: colors.dark.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
  },
  callBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.dark.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  }
});
