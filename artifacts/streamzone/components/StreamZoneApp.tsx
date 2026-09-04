import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import Reanimated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useStreamStore } from '@/store/useStreamStore';
import colors, { ThemeColors } from '@/constants/colors';
import {
  avatarImages,
  chatMessages,
  coinPackages,
  conversations,
  feedPosts,
  gifts,
  historyItems,
  liveRooms,
  partyRooms,
} from '@/mock-data';
import {
  createBroadcast,
  getMyActiveBroadcast,
  getBroadcastById,
  endBroadcast,
  sendHeartbeat,
  getLiveBroadcasts,
  getActiveGifts,
  getStoreItems,
  rechargeCoins,
  convertDiamonds,
  buyStoreItem,
  equipStoreItem,
  unequipStoreItem,
  getLevels,
  getMyProgress,
} from '@/services/api';
import { socketService } from '@/services/socketService';
import { useAuth } from '@/store/authStore';
import AgoraVideoView, { AgoraVideoViewRef } from './AgoraVideoView';
export { AgoraVideoView };
export type { AgoraVideoViewRef };
type IconName = keyof typeof Ionicons.glyphMap;
type Screen =
  | 'home'
  | 'feed'
  | 'rooms'
  | 'messages'
  | 'profile'
  | 'wallet'
  | 'income'
  | 'store'
  | 'free'
  | 'ranking'
  | 'room'
  | 'pk'
  | 'multi'
  | 'voice'
  | 'auth'
  | 'setup'
  | 'chat';

type RoomMode = 'room' | 'pk' | 'multi' | 'voice';

declare var require: any;
declare var process: any;

const banner = require('../assets/images/discover-banner.jpg');
const streamParty = require('../assets/images/stream-party.jpg');
const streamHost = require('../assets/images/stream-host.jpg');

export const icons3d = {
  mall: require('../assets/images/icons/3d_mall_bag_1787991119223.jpg'),
  crown: require('../assets/images/icons/3d_vip_crown_1787991130238.jpg'),
  chat: require('../assets/images/icons/3d_chat_bubble_1787991150623.jpg'),
  tasks: require('../assets/images/icons/3d_daily_tasks_1787991161075.jpg'),
  heart: require('../assets/images/icons/3d_heart_love_1787991139639.jpg'),
  badge: require('../assets/images/icons/3d_badge_icon_1787990972515.jpg'),
  wallet: require('../assets/images/icons/3d_wallet_coin_1787990983379.jpg'),
  trophy: require('../assets/images/icons/3d_trophy_leaderboard_1787991782963.jpg'),
  settings: require('../assets/images/icons/3d_settings_gear_1787991860945.jpg'),
};


export function Icon({ name, size = 20, color, style }: { name: IconName; size?: number; color: string; style?: object }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

export function Avatar({ uri, size = 42, ring = false, style }: { uri: string; size?: number; ring?: boolean; style?: object }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2 }, ring && { borderWidth: 2, borderColor: '#f423a0', padding: 2 }, style]}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} />
    </View>
  );
}

export function PillButton({
  label,
  icon,
  onPress,
  palette,
  filled = true,
  small = false,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  palette: ThemeColors;
  filled?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      testID={`button-${label.replace(/\s/g, '-').toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        small ? { paddingHorizontal: 12, paddingVertical: 7 } : { paddingHorizontal: 16, paddingVertical: 11 },
        styles.pill,
        filled ? { backgroundColor: palette.primary } : { backgroundColor: palette.secondary, borderWidth: 1, borderColor: palette.border },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 14 : 16} color={palette.primaryForeground} /> : null}
      <Text style={[styles.pillText, { color: filled ? palette.primaryForeground : palette.foreground, fontSize: small ? 11 : 13 }]}>{label}</Text>
    </Pressable>
  );
}

export function Header({
  title,
  palette,
  onBack,
  right,
}: {
  title: string;
  palette: ThemeColors;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6, backgroundColor: palette.panel }]}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable testID="button-back" onPress={onBack} style={styles.iconButton}>
            <Icon name="chevron-back" size={25} color={palette.foreground} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.headerTitle, { color: palette.foreground }]}>{title}</Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function Logo({ palette }: { palette: ThemeColors }) {
  return (
    <View style={styles.logoWrap}>
      <LinearGradient colors={[palette.pink, palette.purple]} style={styles.logo}>
        <Text style={styles.logoText}>S</Text>
      </LinearGradient>
      <Text style={[styles.wordmark, { color: palette.foreground }]}>STREAMZONE</Text>
    </View>
  );
}

function SectionTitle({ title, action, onAction, palette }: { title: string; action?: string; onAction?: () => void; palette: ThemeColors }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: palette.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.rowAction}>
          <Text style={[styles.rowActionText, { color: palette.primary }]}>{action}</Text>
          <Icon name="chevron-forward" size={14} color={palette.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

import { usePathname } from 'expo-router';

export function BottomNav({ activeTab, palette, onTab, onGoLive }: { activeTab?: string; palette: ThemeColors; onTab: (tab: 'home' | 'rooms' | 'messages' | 'profile') => void; onGoLive: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Determine active tab from pathname
  let currentTab = 'home';
  if (pathname.includes('/rooms')) currentTab = 'rooms';
  else if (pathname.includes('/messages')) currentTab = 'messages';
  else if (pathname.includes('/profile')) currentTab = 'profile';

  const items: { tab: 'home' | 'rooms' | 'messages' | 'profile'; label: string; icon: IconName }[] = [
    { tab: 'home', label: 'Home', icon: 'home' },
    { tab: 'rooms', label: 'Rooms', icon: 'grid' },
    { tab: 'messages', label: 'Inbox', icon: 'chatbubbles' },
    { tab: 'profile', label: 'Profile', icon: 'person' },
  ];
  const bottomPadding = Math.max(insets.bottom, 8);
  return (
    <View style={[
      styles.bottomNav, 
      { 
        backgroundColor: palette.panel, 
        borderTopColor: palette.border,
        paddingBottom: bottomPadding,
        height: 60 + bottomPadding,
      }
    ]}>
      {items.slice(0, 2).map((item) => (
        <Pressable key={item.tab} onPress={() => onTab(item.tab)} style={styles.navItem}>
          <Icon name={item.icon} size={23} color={currentTab === item.tab ? palette.primary : palette.mutedForeground} />
          <Text style={[styles.navLabel, { color: currentTab === item.tab ? palette.primary : palette.mutedForeground }]}>{item.label}</Text>
        </Pressable>
      ))}
      <Pressable testID="button-go-live" onPress={onGoLive} style={({ pressed }) => [styles.liveButton, { backgroundColor: palette.panelAlt, borderColor: palette.primary }, pressed && styles.pressed]}>
        <LinearGradient colors={[palette.pink, palette.purple]} style={styles.liveButtonInner}>
          <Icon name="mic" size={25} color={palette.primaryForeground} />
        </LinearGradient>
      </Pressable>
      {items.slice(2).map((item) => (
        <Pressable key={item.tab} onPress={() => onTab(item.tab)} style={styles.navItem}>
          {item.tab === 'profile' ? (
            <Avatar uri={user?.avatarUrl || avatarImages[0]} size={23} ring={currentTab === item.tab} />
          ) : (
            <Icon name={item.icon} size={23} color={currentTab === item.tab ? palette.primary : palette.mutedForeground} />
          )}
          <Text style={[styles.navLabel, { color: currentTab === item.tab ? palette.primary : palette.mutedForeground }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function HomeScreen({ palette, onNavigate, onOpenRoom }: { palette: ThemeColors; onNavigate: (screen: Screen) => void; onOpenRoom: (mode: RoomMode, broadcastId?: string, channelName?: string) => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Explore');
  const [query, setQuery] = useState('');
  const [activeBroadcasts, setActiveBroadcasts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    getLiveBroadcasts().then((data: any) => {
      if (data) setActiveBroadcasts(data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        api.get(`/users/search?q=${query}`).then((res: any) => {
          setSearchResults(res.data);
        }).catch(console.error);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const filteredRooms = activeBroadcasts.filter((room) => room.title?.toLowerCase().includes(query.toLowerCase()) || room.broadcaster?.displayName?.toLowerCase().includes(query.toLowerCase()));
  const chips = ['Explore', 'Live rooms', 'Party', 'PK battle'];
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}>
        <View style={[styles.homeTop, { paddingTop: insets.top + 8 }]}>
          <Logo palette={palette} />
          <View style={styles.topActions}>
            <Pressable onPress={() => onNavigate('ranking')} style={[styles.roundAction, { backgroundColor: palette.secondary }]}>
              <Icon name="trophy" size={20} color={palette.gold} />
            </Pressable>
          </View>
        </View>
        <View style={[styles.searchBar, { backgroundColor: palette.secondary }]}>
          <Icon name="search" size={18} color={palette.mutedForeground} />
          <TextInput testID="input-search" value={query} onChangeText={setQuery} placeholder="Search people, rooms..." placeholderTextColor={palette.mutedForeground} style={[styles.searchInput, { color: palette.foreground }]} />
          {query.length > 0 ? <Pressable onPress={() => setQuery('')}><Icon name="close-circle" size={18} color={palette.mutedForeground} /></Pressable> : null}
        </View>
        <Image source={banner} style={styles.banner} resizeMode="cover" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {chips.map((chip) => (
            <Pressable key={chip} onPress={() => setFilter(chip)} style={[styles.chip, { backgroundColor: filter === chip ? palette.primary : palette.secondary }]}>
              <Text style={[styles.chipText, { color: filter === chip ? palette.primaryForeground : palette.mutedText }]}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {query.length > 0 && searchResults.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <SectionTitle title="People" action="View all" onAction={() => {}} palette={palette} />
            {searchResults.filter((u) => u._id !== user?._id).map((u) => (
              <Pressable key={u._id} onPress={() => router.push(`/user-profile/${u._id}`)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
                <Avatar uri={u.avatarUrl || 'https://via.placeholder.com/150'} size={48} ring />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: palette.foreground, fontSize: 16, fontWeight: 'bold' }}>{u.displayName}</Text>
                  <Text style={{ color: palette.mutedText, fontSize: 14 }}>@{u.username}</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={palette.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {filter === 'Party' ? (
          <View style={{ paddingHorizontal: 16 }}>
            <SectionTitle title="Party rooms" action="See all" onAction={() => onOpenRoom('voice')} palette={palette} />
            {partyRooms.map((room, index) => <PartyRoomCard key={room.id} room={room} index={index} palette={palette} onPress={() => onOpenRoom('voice')} />)}
          </View>
        ) : filter === 'PK battle' ? (
          <View style={{ paddingHorizontal: 16 }}>
            <SectionTitle title="Live battles" action="Join a battle" onAction={() => onOpenRoom('pk')} palette={palette} />
            <Pressable onPress={() => onOpenRoom('pk')} style={[styles.battlePreview, { backgroundColor: palette.panelAlt }]}>
              <View style={styles.battleAvatars}><Avatar uri={liveRooms[1].image} size={72} ring /><Text style={[styles.vsText, { color: palette.primary }]}>VS</Text><Avatar uri={liveRooms[3].image} size={72} ring /></View>
              <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: palette.foreground }]}>Tonight’s creator battle</Text><Text style={[styles.cardMeta, { color: palette.mutedText }]}>Starts in 02:04:36  •  8.2K watching</Text></View>
              <Icon name="chevron-forward" size={20} color={palette.primary} />
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <SectionTitle title={filter === 'Live rooms' ? 'Live now' : 'Trending creators'} action="View all" onAction={() => onNavigate('feed')} palette={palette} />
            <View style={styles.grid}>
              {filteredRooms.slice(0, 6).map((room, index) => <LiveCard key={room._id} room={room} index={index} palette={palette} onPress={() => onOpenRoom('room', room._id, room.channelName)} />)}
              {filteredRooms.length === 0 && <Text style={{ color: palette.mutedText, textAlign: 'center', marginTop: 40, width: '100%' }}>No live broadcasts right now.</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LiveCard({ room, index, palette, onPress }: { room: any; index: number; palette: ThemeColors; onPress: () => void }) {
  const source = room.image ? { uri: room.image } : index % 2 === 0 ? streamParty : streamHost;
  return (
    <Pressable onPress={onPress} style={styles.liveCard}>
      <ImageBackground source={source} style={styles.liveCardImage} imageStyle={{ borderRadius: 16 }}>
        <LinearGradient colors={['transparent', 'rgba(16,3,24,0.85)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
        <View style={styles.viewerBadge}><Icon name="person" size={11} color="#fff" /><Text style={styles.viewerText}>{Math.floor(Math.random() * 100) + 1}</Text></View>
        <View style={styles.liveCardBottom}>
          <Text style={styles.liveName} numberOfLines={1}>{room.title || 'Live Broadcast'}</Text>
          <View style={styles.liveMeta}><Text style={styles.liveHandle} numberOfLines={1}>{room.broadcaster?.displayName || 'Host'}</Text></View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function PartyRoomCard({ room, index, palette, onPress }: { room: typeof partyRooms[number]; index: number; palette: ThemeColors; onPress: () => void }) {
  const colorsForCard = ['#3278ee', '#d92e9f', '#e97a1a', '#a81cdc'];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.partyCard, { backgroundColor: colorsForCard[index % colorsForCard.length] }, pressed && styles.pressed]}>
      <Image source={{ uri: room.image }} style={styles.partyImage} />
      <View style={styles.partyCopy}><Text style={styles.partyName}>{room.name}</Text><Text style={styles.partyDescription}>Welcome to our room · come say hello and join the conversation.</Text><View style={styles.partyPeople}><Avatar uri={avatarImages[index]} size={19} /><Avatar uri={avatarImages[index + 2]} size={19} style={{ marginLeft: -7 }} /><Text style={styles.partyViewers}><Icon name="volume-high" size={12} color="#ffffff" /> {room.viewers}</Text></View></View>
      <View style={styles.roomType}><Icon name={room.isPrivate ? 'lock-closed' : 'globe-outline'} size={11} color="#ffffff" /><Text style={styles.roomTypeText}>{room.category}</Text></View>
    </Pressable>
  );
}

export function FeedScreen({ palette, onBack, onOpenRoom }: { palette: ThemeColors; onBack: () => void; onOpenRoom: (mode: RoomMode) => void }) {
  const { user } = useAuth();
  const togglePostLike = useStreamStore((state) => state.togglePostLike);
  const likedPosts = useStreamStore((state) => state.likedPosts);
  const [tab, setTab] = useState<'Feeds' | 'Video'>('Feeds');
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
        <View style={styles.feedHeader}><View style={styles.feedTabs}>{(['Feeds', 'Video'] as const).map((item) => <Pressable key={item} onPress={() => setTab(item)}><Text style={[styles.feedTab, { color: tab === item ? palette.primary : palette.mutedForeground }]}>{item}</Text>{tab === item ? <View style={[styles.feedUnderline, { backgroundColor: palette.primary }]} /> : null}</Pressable>)}</View></View>
        {tab === 'Video' ? <VideoPreview palette={palette} onOpenRoom={onOpenRoom} /> : feedPosts.map((post) => (
          <View key={post.id} style={styles.post}>
            <View style={styles.postAuthor}><Avatar uri={post.image} size={40} ring /><View style={{ flex: 1 }}><Text style={[styles.postName, { color: palette.foreground }]}>{post.name}</Text><Text style={[styles.postCountry, { color: palette.mutedText }]}><Icon name="location" size={12} color={palette.primary} /> {post.country}</Text></View><PillButton label={useStreamStore.getState().following.includes(post.id) ? 'Following' : 'Follow'} icon="person-add" onPress={() => useStreamStore.getState().toggleFollowing(post.id)} palette={palette} small /><Icon name="ellipsis-vertical" size={20} color={palette.foreground} /></View>
            <Image source={{ uri: post.image }} style={styles.postImage} />
            <View style={styles.postActions}><Pressable onPress={() => togglePostLike(post.id)} style={styles.actionItem}><Icon name={likedPosts.includes(post.id) ? 'heart' : 'heart-outline'} size={22} color={likedPosts.includes(post.id) ? palette.primary : palette.foreground} /><Text style={[styles.actionCount, { color: palette.mutedText }]}>{post.likes}</Text></Pressable><View style={styles.actionItem}><Icon name="chatbubble-ellipses-outline" size={20} color={palette.foreground} /><Text style={[styles.actionCount, { color: palette.mutedText }]}>{post.comments}</Text></View><Icon name="paper-plane-outline" size={20} color={palette.foreground} /></View>
            <Text style={[styles.caption, { color: palette.mutedText }]}>{post.caption}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function VideoPreview({ palette, onOpenRoom }: { palette: ThemeColors; onOpenRoom: (mode: RoomMode) => void }) {
  return (
    <Pressable onPress={() => onOpenRoom('room')} style={styles.videoPreview}>
      <ImageBackground source={streamParty} style={styles.videoImage} imageStyle={styles.videoImageRadius}>
        <LinearGradient colors={['rgba(29,7,48,0.2)', 'rgba(29,7,48,0.9)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.videoSideActions}><Icon name="heart" size={29} color="#fff" /><Text style={styles.videoSideText}>100k</Text><Icon name="chatbubble-ellipses" size={27} color="#fff" /><Text style={styles.videoSideText}>120</Text><Icon name="share-social" size={27} color="#fff" /></View>
        <View style={styles.videoCaption}><Text style={styles.videoName}>Malaika khan</Text><Text style={styles.videoHandle}>@malaika_khan</Text><Text style={styles.videoQuestion}>What’s Happen Today?</Text></View>
      </ImageBackground>
    </Pressable>
  );
}

export function ProfileScreen({ palette, onNavigate, onTheme }: { palette: ThemeColors; onNavigate: (screen: Screen) => void; onTheme: () => void }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const age = user?.birthdate ? Math.floor((Date.now() - new Date(user.birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 18;
  const genderSymbol = user?.gender === 'Man' ? '♂' : '♀';
  const streamCoins = useStreamStore((state: any) => state.coins);
  const streamDiamonds = useStreamStore((state: any) => state.diamonds);
  const coinsDisplay = (user?.coins !== undefined ? user.coins : streamCoins).toLocaleString();
  const diamondsDisplay = (user?.diamonds !== undefined ? user.diamonds : streamDiamonds).toLocaleString();

  // Real level data from user object
  const realLevel = (user as any)?.currentLevel || 1;
  const levelBadgeUrl = (user as any)?.levelBadgeUrl;
  const activeFrame = (user as any)?.activeFrame;
  
  const handleSignOut = async () => {
    await logout();
    onNavigate('auth');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}>
        <View style={[styles.profileTop, { paddingTop: insets.top + 8 }]}><Pressable onPress={() => onNavigate('home')} style={styles.iconButton}><Icon name="chevron-back" size={25} color={palette.foreground} /></Pressable><Text style={[styles.headerTitle, { color: palette.foreground }]}>My Profile</Text></View>
        <View style={styles.profileIdentity}>
          {/* Avatar with active frame ring */}
          <View style={{ position: 'relative' }}>
            <Avatar uri={user?.avatarUrl || avatarImages[0]} size={98} ring={!!activeFrame} />
            {activeFrame ? (
              <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: palette.gold, borderRadius: 12, paddingHorizontal: 4, paddingVertical: 2 }}>
                <Icon name="layers" size={12} color="#000" />
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: palette.foreground }]}>{user?.displayName || user?.username || 'User'}</Text>
            <Text style={[styles.profileId, { color: palette.mutedText }]}>@{user?.username || 'user'}  <Icon name="copy-outline" size={13} color={palette.mutedText} /></Text>
            <View style={styles.levelRow}>
              <Text style={[styles.levelPill, { backgroundColor: palette.primary }]}>{genderSymbol} {age}</Text>
              {/* Real level badge - tappable to open levels screen */}
              <Pressable onPress={() => router.push('/levels' as any)} style={[styles.levelPill, { backgroundColor: palette.purple, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                {levelBadgeUrl ? (
                  <Image source={{ uri: levelBadgeUrl }} style={{ width: 16, height: 16, borderRadius: 8 }} />
                ) : (
                  <Icon name="shield" size={12} color="#fff" />
                )}
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Lv.{realLevel}</Text>
                <Icon name="chevron-forward" size={10} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          </View>
          <PillButton label="Edit Self" icon="person" onPress={() => onNavigate('setup')} palette={palette} small />
        </View>
        <View style={[styles.stats, { backgroundColor: palette.card, borderColor: palette.border }]}>{[['0', 'Following'], ['0', 'Fans'], ['0', 'Blocked User']].map(([value, label]) => <View key={label} style={styles.stat}><Text style={[styles.statValue, { color: palette.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: palette.mutedText }]}>{label}</Text></View>)}</View>
        <Pressable onPress={() => onNavigate('wallet')} style={[styles.diamondCard, { paddingVertical: 14 }]}>
          <LinearGradient colors={[palette.purple, palette.pink]} style={StyleSheet.absoluteFillObject} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.diamondIcon}><Icon name="wallet" size={26} color={palette.gold} /></View>
              <View>
                <Text style={styles.diamondLabel}>Coins</Text>
                <Text style={styles.diamondAmount}>{coinsDisplay}</Text>
              </View>
            </View>
            <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.diamondIcon, { backgroundColor: 'rgba(92,213,247,0.25)' }]}><Icon name="diamond" size={26} color="#58d5f7" /></View>
              <View>
                <Text style={styles.diamondLabel}>Diamonds</Text>
                <Text style={[styles.diamondAmount, { color: '#58d5f7' }]}>{diamondsDisplay}</Text>
              </View>
            </View>
            <View style={styles.walletButton}>
              <Text style={styles.walletButtonText}>Wallet</Text>
              <Icon name="chevron-forward" size={14} color={palette.primary} />
            </View>
          </View>
        </Pressable>
        <FeatureSection title="Host & VIP Privilege" palette={palette} items={[['My Agency', icons3d.crown, 'multi'], ['Host Center', icons3d.badge, 'setup'], ['CP List', icons3d.heart, 'room'], ['Become VIP', icons3d.crown, 'store']]} onNavigate={onNavigate} />
        <FeatureSection title="My Features" palette={palette} items={[['My Wallet', icons3d.wallet, 'wallet'], ['Chat Price', icons3d.chat, 'messages'], ['Daily Tasks', icons3d.tasks, 'feed'], ['Store', icons3d.mall, 'store'], ['Top Givers', icons3d.trophy, 'ranking'], ['Settings', icons3d.settings, 'setup']]} onNavigate={onNavigate} />
        <Pressable onPress={handleSignOut} style={[styles.signOut, { borderColor: palette.border }]}><Icon name="log-out-outline" size={18} color={palette.primary} /><Text style={[styles.signOutText, { color: palette.primary }]}>Sign Out</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function FeatureSection({ title, items, palette, onNavigate }: { title: string; items: [string, any, Screen][]; palette: ThemeColors; onNavigate: (screen: Screen) => void }) {
  return (
    <View style={[styles.featureSection, { backgroundColor: palette.card, borderColor: palette.border }]}><Text style={[styles.featureTitle, { color: palette.foreground }]}>{title}</Text><View style={styles.featureGrid}>{items.map(([label, iconSource, screen]) => <Pressable key={label} onPress={() => onNavigate(screen)} style={styles.featureItem}>
      {typeof iconSource === 'string' ? <View style={[styles.featureIcon, { backgroundColor: palette.secondary, borderColor: palette.border }]}><Icon name={iconSource as IconName} size={23} color={palette.primary} /></View> : <Image source={iconSource} style={{ width: 44, height: 44, marginBottom: 6, borderRadius: 12 }} />}
      <Text style={[styles.featureLabel, { color: palette.mutedText }]}>{label}</Text></Pressable>)}</View></View>
  );
}

export function MessagesScreen({ palette, onOpenChat }: { palette: ThemeColors; onOpenChat: (id: string) => void }) {
  const readConversationIds = useStreamStore((state) => state.readConversationIds);
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
        <View style={styles.messageHeader}><Text style={[styles.pageTitle, { color: palette.primary }]}>Messages</Text><View style={styles.topActions}><Pressable style={[styles.roundAction, { backgroundColor: palette.secondary }]}><Icon name="trash" size={18} color={palette.primary} /></Pressable></View></View>
        {conversations.map((conversation) => <Pressable key={conversation.id} onPress={() => onOpenChat(conversation.id)} style={({ pressed }) => [styles.conversation, { backgroundColor: palette.card }, pressed && styles.pressed]}><Avatar uri={conversation.image} size={48} ring /><View style={{ flex: 1 }}><Text style={[styles.conversationName, { color: palette.foreground }]}>{conversation.name} <Text style={{ color: palette.gold }}>{conversation.country === 'IN' ? '●' : '✦'}</Text></Text><Text style={[styles.conversationMessage, { color: palette.mutedText }]} numberOfLines={1}>{conversation.message}</Text></View><View style={styles.conversationRight}>{conversation.unread && !readConversationIds.includes(conversation.id) ? <View style={[styles.unread, { backgroundColor: palette.primary }]}><Text style={styles.unreadText}>{conversation.unread}</Text></View> : null}<Text style={[styles.conversationTime, { color: palette.mutedText }]}>{conversation.time}</Text></View></Pressable>)}
      </ScrollView>
    </View>
  );
}

export function WalletScreen({ palette, onBack, onNavigate }: { palette: ThemeColors; onBack: () => void; onNavigate: (screen: Screen) => void }) {
  const coins = useStreamStore((state: any) => state.coins);
  const diamonds = useStreamStore((state: any) => state.diamonds);
  const setBalances = useStreamStore((state: any) => state.setBalances);
  const [loading, setLoading] = useState(false);

  const handleRecharge = (amount: number, priceStr: string) => {
    Alert.alert(
      'Recharge Coins',
      `Would you like to purchase ${amount.toLocaleString()} coins for ${priceStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Recharge',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await rechargeCoins(amount, priceStr);
              if (res && res.success) {
                setBalances({ coins: res.coins, diamonds: res.diamonds });
                Alert.alert('Recharge Successful', `Added ${amount.toLocaleString()} coins to your balance!`);
              }
            } catch (err: any) {
              console.error('Recharge failed', err);
              Alert.alert('Recharge Failed', err.response?.data?.message || 'Could not complete recharge. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="My Wallet" palette={palette} onBack={onBack} right={<PillButton label="History" icon="receipt" onPress={() => {}} palette={palette} small />} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 112 }}>
        <LinearGradient colors={[palette.purple, palette.pink]} style={[styles.balanceCard, { paddingVertical: 18 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.balanceGem}><Icon name="wallet" size={32} color={palette.gold} /></View>
              <View>
                <Text style={styles.balanceLabel}>Gold Coins</Text>
                <Text style={styles.balanceValue}>{coins.toLocaleString()}</Text>
              </View>
            </View>
            <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.balanceGem, { backgroundColor: 'rgba(92,213,247,0.25)' }]}><Icon name="diamond" size={32} color="#58d5f7" /></View>
              <View>
                <Text style={styles.balanceLabel}>Diamonds</Text>
                <Text style={[styles.balanceValue, { color: '#58d5f7' }]}>{diamonds.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.walletActions}>
          <PillButton label={loading ? 'Processing...' : 'Quick Recharge'} icon="diamond" onPress={() => handleRecharge(500, '$5.00')} palette={palette} />
          <PillButton label="My Income" icon="trending-up" onPress={() => onNavigate('income')} palette={palette} filled={false} />
        </View>

        <LinearGradient colors={['#552a3f', '#ee6e16']} style={styles.planCard}>
          <View style={styles.bestPlan}><Text style={styles.bestPlanText}>BEST VALUE</Text></View>
          <Icon name="diamond" size={38} color={palette.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.planEyebrow}>Mega Recharge Pack</Text>
            <Text style={styles.planValue}>+ 5,000 Coins</Text>
          </View>
          <View style={styles.planPrice}><Text style={styles.planPriceText}>$ 49.99</Text></View>
          <Pressable onPress={() => handleRecharge(5000, '$49.99')} style={styles.planFooter}>
            <Text style={styles.planFooterText}>Purchase Recharge Plan</Text>
            <Icon name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        </LinearGradient>

        <SectionTitle title="Recharge Packages" palette={palette} />
        <View style={styles.coinGrid}>
          {coinPackages.map((item) => {
            const coinNum = Number(item.coins.replace(/,/g, ''));
            return (
              <Pressable
                key={item.coins}
                onPress={() => handleRecharge(coinNum, item.price)}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.coinPackage,
                  { backgroundColor: palette.card, borderColor: palette.border },
                  pressed && styles.pressed,
                ]}
              >
                {item.popular ? (
                  <View style={[styles.popularTag, { backgroundColor: palette.gold }]}>
                    <Text style={styles.popularTagText}>POPULAR</Text>
                  </View>
                ) : null}
                <Icon name="diamond" size={28} color={palette.gold} />
                <Text style={[styles.coinAmount, { color: palette.gold }]}>{item.coins}</Text>
                <View style={[styles.coinPrice, { backgroundColor: palette.primary }]}>
                  <Text style={styles.coinPriceText}>{item.price}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Recent activity" action="All" onAction={() => {}} palette={palette} />
        {historyItems.map((item) => (
          <View key={item.label} style={[styles.historyItem, { borderBottomColor: palette.border }]}>
            <View style={[styles.historyIcon, { backgroundColor: palette.secondary }]}>
              <Icon name={item.type === 'in' ? 'arrow-down' : 'arrow-up'} size={17} color={item.type === 'in' ? palette.success : palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyLabel, { color: palette.foreground }]}>{item.label}</Text>
              <Text style={[styles.historyDetail, { color: palette.mutedText }]}>{item.detail}</Text>
            </View>
            <Text style={[styles.historyAmount, { color: item.type === 'in' ? palette.success : palette.primary }]}>{item.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function IncomeScreen({ palette, onBack }: { palette: ThemeColors; onBack: () => void }) {
  const diamonds = useStreamStore((state) => state.diamonds);
  const setBalances = useStreamStore((state) => state.setBalances);
  const [amount, setAmount] = useState('100');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) {
      setStatus('Please enter a valid amount of diamonds');
      return;
    }
    if (num > diamonds) {
      setStatus('Insufficient diamonds balance');
      return;
    }

    try {
      setLoading(true);
      const res = await convertDiamonds(num);
      if (res && res.success) {
        setBalances({ coins: res.coins, diamonds: res.diamonds });
        setStatus(`Successfully converted ${num} diamonds to ${num * 10} coins!`);
      }
    } catch (e: any) {
      setStatus(e.response?.data?.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="My Income" palette={palette} onBack={onBack} right={<PillButton label="History" icon="receipt" onPress={() => {}} palette={palette} small />} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 112 }}>
        <LinearGradient colors={[palette.purple, '#5b23b7']} style={styles.incomeCard}>
          <View>
            <Text style={styles.balanceLabel}>Available Diamonds (R-Coins) :</Text>
            <Text style={styles.incomeValue}>{diamonds.toLocaleString()}</Text>
            <View style={styles.conversion}>
              <Text style={styles.conversionText}>10 Diamonds  =  100 Coins</Text>
            </View>
          </View>
          <View style={styles.rCoin}><Text style={styles.rCoinText}>R</Text></View>
        </LinearGradient>
        <Text style={[styles.formLabel, { color: palette.foreground }]}>Convert Diamonds to Coins :</Text>
        <View style={[styles.withdrawInput, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="Enter diamonds to convert"
            placeholderTextColor={palette.mutedForeground}
            style={[styles.withdrawText, { color: palette.foreground }]}
          />
          <Text style={[styles.withdrawAmount, { color: palette.foreground }]}>{amount}</Text>
        </View>
        <Text style={[styles.helperText, { color: palette.primary }]}>* You will receive {parseInt(amount || '0', 10) * 10} coins</Text>
        <Pressable
          onPress={handleConvert}
          disabled={loading}
          style={[styles.fullButton, { backgroundColor: palette.primary }]}
        >
          <Text style={styles.fullButtonText}>{loading ? 'Converting...' : 'Convert to Coins'}</Text>
        </Pressable>
        <Pressable onPress={() => setStatus('Cash out is available in the production wallet')} style={[styles.fullButton, { backgroundColor: palette.card }]}>
          <Text style={[styles.fullButtonText, { color: palette.foreground }]}>Cash Out</Text>
        </Pressable>
        {status ? <Text style={[styles.statusText, { color: palette.success }]}>{status}</Text> : null}
        <Text style={[styles.formLabel, { color: palette.foreground, marginTop: 28 }]}>What is R-Coin?</Text>
        <Text style={[styles.explanation, { color: palette.mutedText }]}>
          1. When you receive gifts on StreamZone as a host or in private chat, you earn diamonds.{'\n\n'}
          2. You can convert diamonds directly to coins to gift others or use in the store.{'\n\n'}
          3. Verified hosts can cash out diamonds to real currency.
        </Text>
      </ScrollView>
    </View>
  );
}

export function StoreScreen({ palette, onBack }: { palette: ThemeColors; onBack: () => void }) {
  type StoreTab = 'Frames' | 'Entry Effects' | 'Chat Bubbles';
  const TABS: StoreTab[] = ['Entry Effects', 'Frames', 'Chat Bubbles'];
  const TAB_TYPE_MAP: Record<StoreTab, string> = {
    'Entry Effects': 'entry_effect',
    'Frames': 'frame',
    'Chat Bubbles': 'chat_bubble',
  };

  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<StoreTab>('Entry Effects');
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeFrame, setActiveFrame] = useState<string | null>(null);
  const [activeEntryEffect, setActiveEntryEffect] = useState<string | null>(null);
  const [activeChatBubble, setActiveChatBubble] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { user } = useAuth();
  const coins = useStreamStore((state: any) => state.coins);
  const setBalances = useStreamStore((state: any) => state.setBalances);

  useEffect(() => {
    // Fetch store items
    getStoreItems()
      .then((serverItems: any) => {
        if (serverItems && serverItems.length > 0) setItems(serverItems);
      })
      .catch(console.error);

    // Fetch user progress (inventory + equipped items)
    getMyProgress()
      .then((progress) => {
        setInventory(progress.inventory || []);
      })
      .catch(console.error);

    // Load equipped items from user object
    if (user) {
      setActiveFrame((user as any).activeFrame || null);
      setActiveEntryEffect((user as any).activeEntryEffect || null);
      setActiveChatBubble((user as any).activeChatBubble || null);
    }
  }, []);

  const filteredItems = items.filter((item: any) => item.type === TAB_TYPE_MAP[tab]);

  const isOwned = (itemId: string) => inventory.some((inv) => inv.itemId === itemId);

  const getEquippedId = () => {
    if (tab === 'Frames') return activeFrame;
    if (tab === 'Entry Effects') return activeEntryEffect;
    return activeChatBubble;
  };

  const handleBuy = async (item: any) => {
    if (coins < item.price) {
      Alert.alert('Insufficient Balance', `You need ${item.price.toLocaleString()} coins.\nYour balance: ${coins.toLocaleString()} coins.`);
      return;
    }
    Alert.alert(
      'Confirm Purchase',
      `Purchase "${item.name}" for ${item.price.toLocaleString()} coins (${item.durationDays || 30} days)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setLoadingId(item._id);
            try {
              const res = await buyStoreItem(item._id);
              setBalances({ coins: res.coins });
              setInventory(res.inventory || []);
              Alert.alert('🎉 Item Purchased!', `"${item.name}" has been added to your inventory. Equip it now!`);
            } catch (err: any) {
              Alert.alert('Purchase Failed', err.response?.data?.message || 'Could not complete purchase.');
            } finally {
              setLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEquip = async (item: any) => {
    setLoadingId(item._id);
    try {
      await equipStoreItem(item._id);
      if (item.type === 'frame') setActiveFrame(item._id);
      else if (item.type === 'entry_effect') setActiveEntryEffect(item._id);
      else setActiveChatBubble(item._id);
      Alert.alert('✅ Equipped!', `"${item.name}" is now equipped.`);
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not equip item.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnequip = async (item: any) => {
    setLoadingId(item._id);
    try {
      const typeMap: any = { frame: 'frame', entry_effect: 'entry_effect', chat_bubble: 'chat_bubble' };
      await unequipStoreItem(typeMap[item.type]);
      if (item.type === 'frame') setActiveFrame(null);
      else if (item.type === 'entry_effect') setActiveEntryEffect(null);
      else setActiveChatBubble(null);
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.message || 'Could not unequip item.');
    } finally {
      setLoadingId(null);
    }
  };

  const equippedId = getEquippedId();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header
        title="My Store"
        palette={palette}
        onBack={onBack}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="wallet" size={16} color={palette.gold} />
            <Text style={{ color: palette.gold, fontWeight: '700', fontSize: 13 }}>{coins.toLocaleString()}</Text>
          </View>
        }
      />
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50 }} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segment, { paddingHorizontal: 14, paddingVertical: 7 }, tab === t && { backgroundColor: palette.primary }]}
          >
            <Text style={[styles.segmentText, { color: tab === t ? '#fff' : palette.mutedText }]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 112 }}>
        {items.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <ActivityIndicator color={palette.primary} size="large" />
            <Text style={{ color: palette.mutedText, marginTop: 12 }}>Loading store items...</Text>
          </View>
        )}
        <View style={styles.storeGrid}>
          {filteredItems.map((item: any) => {
            const owned = isOwned(item._id);
            const equipped = equippedId === item._id;
            const isLoading = loadingId === item._id;

            return (
              <View key={item._id} style={[styles.storeItem, { backgroundColor: palette.card, borderWidth: equipped ? 2 : 0, borderColor: palette.primary }]}>
                {equipped && (
                  <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 1, backgroundColor: palette.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>EQUIPPED</Text>
                  </View>
                )}
                <Image source={{ uri: item.imageUrl }} style={styles.carImage} resizeMode="contain" />
                <Text style={[styles.storeName, { color: palette.foreground }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.storePrice, { color: palette.gold }]}>
                  <Icon name="diamond" size={12} color={palette.gold} /> {item.price.toLocaleString()}/{item.durationDays || 30}d
                </Text>

                {isLoading ? (
                  <View style={[styles.purchaseButton, { backgroundColor: palette.secondary }]}>
                    <ActivityIndicator size="small" color={palette.primary} />
                  </View>
                ) : !owned ? (
                  <Pressable onPress={() => handleBuy(item)} style={[styles.purchaseButton, { backgroundColor: palette.primary }]}>
                    <Text style={styles.purchaseText}>Buy</Text>
                  </Pressable>
                ) : equipped ? (
                  <Pressable onPress={() => handleUnequip(item)} style={[styles.purchaseButton, { backgroundColor: palette.secondary }]}>
                    <Text style={[styles.purchaseText, { color: palette.foreground }]}>Unequip</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => handleEquip(item)} style={[styles.purchaseButton, { backgroundColor: palette.success }]}>
                    <Text style={styles.purchaseText}>Equip</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {filteredItems.length === 0 && items.length > 0 && (
            <Text style={{ color: palette.mutedText, textAlign: 'center', width: '100%', marginTop: 40 }}>
              No {tab} available yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function LevelsScreen({ palette, onBack }: { palette: ThemeColors; onBack: () => void }) {
  const { user } = useAuth();
  const [levels, setLevels] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Promise.all([
      getLevels().catch(() => []),
      getMyProgress().catch(() => null),
    ]).then(([lvls, prog]) => {
      setLevels(lvls || []);
      setProgress(prog);
      setLoading(false);
    });
  }, []);

  const currentLevel = progress?.currentLevel;
  const nextLevel = progress?.nextLevel;
  const progressPercent = progress?.progressPercent ?? 0;
  const xpToNext = progress?.xpToNextLevel ?? 0;
  const currentXP = progress?.xp ?? 0;

  const TIER_COLORS: Record<number, string> = {
    1: '#9E9E9E', 2: '#9E9E9E', 3: '#9E9E9E', 4: '#9E9E9E', 5: '#9E9E9E',
    6: '#4CAF50', 7: '#4CAF50', 8: '#4CAF50', 9: '#4CAF50', 10: '#4CAF50',
    11: '#2196F3', 12: '#2196F3', 13: '#2196F3', 14: '#2196F3', 15: '#2196F3',
    16: '#9C27B0', 17: '#9C27B0', 18: '#9C27B0', 19: '#9C27B0', 20: '#9C27B0',
    21: '#FF9800', 22: '#FF9800', 23: '#FF9800', 24: '#FF9800', 25: '#FF9800',
    26: '#F44336', 27: '#F44336', 28: '#F44336', 29: '#F44336', 30: '#FFD700',
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="My Levels" palette={palette} onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ color: palette.mutedText, marginTop: 12 }}>Loading your progress...</Text>
          </View>
        ) : (
          <>
            {/* Current Level Card */}
            <LinearGradient
              colors={[currentLevel?.color || palette.purple, palette.pink]}
              style={{ margin: 16, borderRadius: 20, padding: 24, alignItems: 'center' }}
            >
              {/* Badge */}
              {currentLevel?.badgeUrl ? (
                <Image source={{ uri: currentLevel.badgeUrl }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 32 }}>{currentLevel?.emoji || '⭐'}</Text>
                </View>
              )}
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>Level {currentLevel?.level || 1}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 16 }}>{currentLevel?.name || 'Seedling 🌱'}</Text>

              {/* XP Progress Bar */}
              <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 10, marginBottom: 8, overflow: 'hidden' }}>
                <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#fff', borderRadius: 8 }} />
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                {currentXP.toLocaleString()} XP  •  {xpToNext.toLocaleString()} XP to next level
              </Text>
              {nextLevel && (
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
                  Next: {nextLevel.name} (Level {nextLevel.level})
                </Text>
              )}
            </LinearGradient>

            {/* Level Journey */}
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ color: palette.foreground, fontSize: 17, fontWeight: '700', marginBottom: 12 }}>Level Roadmap</Text>
              {levels.map((lvl: any) => {
                const isCurrentLevel = currentLevel?.level === lvl.level;
                const isPassed = (currentLevel?.level || 0) > lvl.level;
                const tierColor = lvl.color || TIER_COLORS[lvl.level] || palette.primary;

                return (
                  <View
                    key={lvl._id || lvl.level}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 10,
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: isCurrentLevel ? `${tierColor}22` : palette.card,
                      borderWidth: isCurrentLevel ? 2 : 0,
                      borderColor: tierColor,
                      opacity: !isPassed && !isCurrentLevel && (currentLevel?.level || 0) < lvl.level ? 0.65 : 1,
                    }}
                  >
                    {/* Badge/Number */}
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isPassed || isCurrentLevel ? tierColor : palette.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {lvl.badgeUrl ? (
                        <Image source={{ uri: lvl.badgeUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      ) : (
                        <Text style={{ fontSize: isPassed ? 14 : 16 }}>{isPassed ? '✓' : lvl.emoji || '⭐'}</Text>
                      )}
                    </View>

                    {/* Level Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.foreground, fontWeight: '700', fontSize: 14 }}>
                        Level {lvl.level}  <Text style={{ color: tierColor }}>{lvl.name}</Text>
                      </Text>
                      <Text style={{ color: palette.mutedText, fontSize: 12 }}>{lvl.minXP.toLocaleString()} XP required</Text>

                      {/* Rewards */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {lvl.rewardCoins > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon name="wallet" size={11} color={palette.gold} />
                            <Text style={{ color: palette.gold, fontSize: 11, fontWeight: '600' }}>{lvl.rewardCoins}</Text>
                          </View>
                        )}
                        {lvl.rewardDiamonds > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon name="diamond" size={11} color="#58d5f7" />
                            <Text style={{ color: '#58d5f7', fontSize: 11, fontWeight: '600' }}>{lvl.rewardDiamonds}</Text>
                          </View>
                        )}
                        {lvl.rewardStoreItem && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon name="gift" size={11} color={palette.primary} />
                            <Text style={{ color: palette.primary, fontSize: 11 }}>Free gift</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Status */}
                    {isCurrentLevel && (
                      <View style={{ backgroundColor: tierColor, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>CURRENT</Text>
                      </View>
                    )}
                    {isPassed && (
                      <Icon name="checkmark-circle" size={20} color={palette.success} />
                    )}
                  </View>
                );
              })}
              {levels.length === 0 && (
                <Text style={{ color: palette.mutedText, textAlign: 'center', marginTop: 24 }}>
                  No levels configured yet. Please seed the levels data.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function FreeDiamondsScreen({ palette, onBack }: { palette: ThemeColors; onBack: () => void }) {
  const [message, setMessage] = useState('');
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Free Diamonds" palette={palette} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 112 }}>
        <Text style={[styles.methodTitle, { color: palette.primary }]}>Method 1:</Text><Text style={[styles.methodCopy, { color: palette.mutedText }]}>Watch a short advertisement video and earn free diamonds instantly. Tap the button below to start watching and receive your reward.</Text>
        <View style={[styles.rewardCard, { backgroundColor: palette.card }]}><View style={styles.rewardArt}><Icon name="videocam" size={40} color={palette.primary} /><Icon name="diamond" size={44} color={palette.gold} /></View><Text style={[styles.rewardTitle, { color: palette.gold }]}>Watch Video</Text><Text style={[styles.rewardCopy, { color: palette.mutedText }]}>Get free diamonds</Text><Pressable onPress={() => setMessage('Reward added to your balance')} style={[styles.fullButton, { backgroundColor: '#fff', marginTop: 14 }]}><Icon name="play" size={16} color={palette.primary} /><Text style={[styles.fullButtonText, { color: palette.primary }]}>Watch Video Now</Text></Pressable></View>
        <Text style={[styles.methodTitle, { color: palette.primary, marginTop: 24 }]}>Method 2:</Text><Text style={[styles.methodCopy, { color: palette.mutedText }]}>Invite your friends to join using your referral code. Earn rewards every time your code is used!</Text><View style={[styles.referralCard, { backgroundColor: palette.card }]}><Text style={[styles.referralTitle, { color: palette.gold }]}>REFER A FRIEND</Text><View style={styles.referralPeople}><Icon name="people" size={68} color={palette.primary} /><Icon name="sparkles" size={24} color={palette.gold} /></View><Text style={[styles.referralLabel, { color: palette.mutedText }]}>My Refer Code :</Text><View style={[styles.referralCode, { backgroundColor: palette.panel }]}><Text style={[styles.codeText, { color: palette.primary }]}>WPZCPA120DBM</Text><Icon name="share-social" size={21} color={palette.primary} /><Icon name="copy" size={19} color={palette.primary} /></View></View>{message ? <Text style={[styles.statusText, { color: palette.success }]}>{message}</Text> : null}
      </ScrollView>
    </View>
  );
}

export function RankingScreen({ palette, onBack }: { palette: ThemeColors; onBack: () => void }) {
  const top = [{ name: 'Anaya Khan_23546', value: '2.7 M', image: avatarImages[0] }, { name: 'Alexa deo_00979', value: '2.6 M', image: avatarImages[1] }, { name: 'Saniya lieo_5557', value: '2.4 M', image: avatarImages[2] }, { name: 'Moondile_12345', value: '2.0 M', image: avatarImages[3] }];
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Top Gifters" palette={palette} onBack={onBack} />
      <LinearGradient colors={[palette.purple, palette.pink]} style={styles.rankingTop}><View style={styles.rankTabs}><Text style={styles.rankTabActive}>Top Gifters</Text><Text style={styles.rankTab}>Star Ranking</Text><Text style={styles.rankTab}>Live Duration</Text></View><View style={styles.podium}><View style={styles.podiumPerson}><Avatar uri={avatarImages[1]} size={58} ring /><Text style={styles.podiumName}>Alexa deo</Text><Text style={styles.podiumValue}>2.9 M</Text></View><View style={styles.podiumPerson}><Avatar uri={avatarImages[0]} size={82} ring /><Text style={styles.podiumName}>Anaya Khan</Text><Text style={styles.podiumValue}>3.0 M</Text></View><View style={styles.podiumPerson}><Avatar uri={avatarImages[2]} size={58} ring /><Text style={styles.podiumName}>Moondile</Text><Text style={styles.podiumValue}>2.8 M</Text></View></View></LinearGradient><ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 60 }}>{top.map((person, index) => <View key={person.name} style={[styles.rankingRow, { backgroundColor: palette.card }]}><Text style={[styles.rankNumber, { color: palette.primary }]}>{index + 4}</Text><Avatar uri={person.image} size={40} /><Text style={[styles.rankingName, { color: palette.foreground }]}>{person.name}</Text><Text style={[styles.rankingValue, { color: palette.gold }]}><Icon name="diamond" size={14} color={palette.gold} /> {person.value}</Text></View>)}</ScrollView>
    </View>
  );
}

export function AuthScreen({ palette, onBack, onComplete }: { palette: ThemeColors; onBack: () => void; onComplete: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { googleLogin } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      onComplete();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Login failed');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={styles.authContainer}>
        {onBack && <Pressable onPress={onBack} style={styles.authBack}><Icon name="chevron-back" size={25} color={palette.foreground} /></Pressable>}
        <Logo palette={palette} />
        <Text style={[styles.authTitle, { color: palette.foreground }]}>{mode === 'login' ? 'Welcome back' : 'Join the live side'}</Text>
        <Text style={[styles.authCopy, { color: palette.mutedText }]}>{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create your profile and find your people.'}</Text>
        <View style={[styles.authInput, { backgroundColor: palette.card, borderColor: palette.border }]}><Icon name="mail-outline" size={18} color={palette.mutedForeground} /><TextInput placeholder="Phone number or email" placeholderTextColor={palette.mutedForeground} style={[styles.authInputText, { color: palette.foreground }]} /></View>
        <Pressable onPress={() => alert('Please use Google Sign-in for now.')} style={[styles.authPrimary, { backgroundColor: palette.primary }]}><Text style={styles.authPrimaryText}>{mode === 'login' ? 'Continue' : 'Create account'}</Text><Icon name="arrow-forward" size={18} color="#fff" /></Pressable>
        <View style={styles.orRow}><View style={[styles.orLine, { backgroundColor: palette.border }]} /><Text style={[styles.orText, { color: palette.mutedForeground }]}>or continue with</Text><View style={[styles.orLine, { backgroundColor: palette.border }]} /></View>
        <View style={styles.socialRow}>
          <Pressable onPress={handleGoogleLogin} style={[styles.socialButton, { backgroundColor: palette.card, borderColor: palette.border }]}><Icon name="logo-google" size={20} color="#e94f5f" /><Text style={[styles.socialText, { color: palette.foreground }]}>Google</Text></Pressable>
          <Pressable onPress={() => alert('Apple sign-in is not implemented yet.')} style={[styles.socialButton, { backgroundColor: palette.card, borderColor: palette.border }]}><Icon name="logo-apple" size={20} color={palette.foreground} /><Text style={[styles.socialText, { color: palette.foreground }]}>Apple</Text></Pressable>
        </View>
        <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}><Text style={[styles.switchAuth, { color: palette.primary }]}>{mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

export function SetupScreen({ palette, onBack, onDone }: { palette: ThemeColors; onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Woman');
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Profile setup" palette={palette} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 112 }}>
        <Text style={[styles.setupEyebrow, { color: palette.primary }]}>MAKE IT YOURS</Text><Text style={[styles.setupTitle, { color: palette.foreground }]}>Tell the room who you are.</Text><Text style={[styles.authCopy, { color: palette.mutedText }]}>You can change these details any time from your profile.</Text><View style={styles.setupAvatar}><Avatar uri={avatarImages[0]} size={94} ring /><Pressable style={[styles.cameraButton, { backgroundColor: palette.primary }]}><Icon name="camera" size={16} color="#fff" /></Pressable></View><Text style={[styles.inputLabel, { color: palette.foreground }]}>Username</Text><View style={[styles.authInput, { backgroundColor: palette.card, borderColor: palette.border }]}><Icon name="at" size={18} color={palette.mutedForeground} /><TextInput value={name} onChangeText={setName} placeholder="Your display name" placeholderTextColor={palette.mutedForeground} style={[styles.authInputText, { color: palette.foreground }]} /></View><Text style={[styles.inputLabel, { color: palette.foreground }]}>Gender</Text><View style={styles.genderRow}>{['Woman', 'Man', 'Prefer not to say'].map((item) => <Pressable key={item} onPress={() => setGender(item)} style={[styles.genderChip, { backgroundColor: gender === item ? palette.primary : palette.secondary }]}><Text style={[styles.genderText, { color: gender === item ? '#fff' : palette.mutedText }]}>{item}</Text></Pressable>)}</View><Text style={[styles.inputLabel, { color: palette.foreground }]}>Birthday</Text><View style={[styles.authInput, { backgroundColor: palette.card, borderColor: palette.border }]}><Icon name="calendar-outline" size={18} color={palette.mutedForeground} /><Text style={[styles.authInputText, { color: palette.mutedText }]}>Choose your birthday</Text></View><Pressable onPress={onDone} style={[styles.authPrimary, { backgroundColor: palette.primary }]}><Text style={styles.authPrimaryText}>Save profile</Text><Icon name="checkmark" size={18} color="#fff" /></Pressable></ScrollView>
    </View>
  );
}

export function ChatScreen({ palette, onBack, conversationId }: { palette: ThemeColors; onBack: () => void; conversationId: string }) {
  const conversation = conversations.find((item) => item.id === conversationId) ?? conversations[0];
  const markConversationRead = useStreamStore((state) => state.markConversationRead);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(() => [
    { id: `${conversation.id}-1`, text: 'Hello', mine: true, type: 'text' as const },
    { id: `${conversation.id}-2`, text: conversation.message, mine: false, type: 'text' as const },
    { id: `${conversation.id}-3`, text: conversation.id === 'c1' ? 'How are you dear?' : 'I will reply when I finish this live.', mine: false, type: 'text' as const },
    { id: `${conversation.id}-4`, text: 'Video Call  •  00:56 min', mine: false, type: 'call' as const },
  ]);
  React.useEffect(() => { markConversationRead(conversation.id); }, [conversation.id, markConversationRead]);
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title={conversation.name} palette={palette} onBack={onBack} right={<View style={styles.chatHeaderActions}><Icon name="videocam" size={22} color={palette.foreground} /><Icon name="ellipsis-vertical" size={22} color={palette.foreground} /></View>} />
      <ScrollView contentContainerStyle={styles.chatContent}>
        <View style={styles.todayPill}><Text style={[styles.todayText, { color: palette.mutedText }]}>Today</Text></View>
        {messages.map((item) => <View key={item.id} style={[styles.chatBubbleRow, item.mine && { justifyContent: 'flex-end' }]}>{!item.mine ? <Avatar uri={avatarImages[3]} size={30} /> : null}<View style={[styles.chatBubble, { backgroundColor: item.mine ? palette.primary : palette.card }, item.type === 'call' && { paddingVertical: 17 }]}>{item.type === 'call' ? <><View style={styles.callIcon}><Icon name="videocam" size={17} color={palette.primary} /></View><Text style={[styles.callTitle, { color: palette.foreground }]}>Video Call</Text><Text style={[styles.callMeta, { color: palette.mutedText }]}>00:56 min     10:48 pm</Text></> : <Text style={styles.chatBubbleText}>{item.text}</Text>}</View>{item.mine ? <Avatar uri={avatarImages[0]} size={30} /> : null}</View>)}
        <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' }} style={styles.chatPhoto} />
      </ScrollView>
      <View style={[styles.quickReplies, { borderTopColor: palette.border }]}>{['Hello', 'How are you??', 'I like You', 'I Miss'].map((item) => <Pressable key={item} onPress={() => setMessage(item)} style={[styles.quickReply, { backgroundColor: palette.secondary }]}><Text style={[styles.quickReplyText, { color: palette.foreground }]}>{item}</Text></Pressable>)}</View>
      <View style={[styles.chatInputRow, { backgroundColor: palette.card, borderColor: palette.border }]}><TextInput value={message} onChangeText={setMessage} placeholder="Say something..." placeholderTextColor={palette.mutedForeground} style={[styles.chatInput, { color: palette.foreground }]} /><Icon name="camera" size={21} color={palette.mutedForeground} /><Pressable onPress={() => { if (message.trim()) { setMessages((items) => [...items, { id: `local-${Date.now()}`, text: message, mine: true, type: 'text' as const }]); setMessage(''); } }} style={[styles.sendButton, { backgroundColor: palette.primary }]}><Icon name="paper-plane" size={17} color="#fff" /></Pressable></View>
    </View>
  );
}

export function LiveRoom({ palette, mode, onClose, broadcastId, channelName, isBroadcaster = false }: { palette: ThemeColors; mode: RoomMode; onClose: () => void; broadcastId?: string; channelName?: string; isBroadcaster?: boolean }) {
  const insets = useSafeAreaInsets();
  const sendGift = useStreamStore((state) => state.sendGift);
  const addPkScore = useStreamStore((state) => state.addPkScore);
  const resetPkScores = useStreamStore((state) => state.resetPkScores);
  const coins = useStreamStore((state) => state.coins);
  const pkScores = useStreamStore((state) => state.pkScores);
  const following = useStreamStore((state) => state.following);
  const toggleFollowing = useStreamStore((state) => state.toggleFollowing);
  const [giftOpen, setGiftOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeGiftsList, setActiveGiftsList] = useState<any[]>(gifts);
  const [selectedGift, setSelectedGift] = useState<any>(gifts[0]);
  const [showGift, setShowGift] = useState(false);
  const [winner, setWinner] = useState(false);
  const [muted, setMuted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(124);
  
  const [entryEffects, setEntryEffects] = useState<any[]>([]);
  const [levelUpEvents, setLevelUpEvents] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);

  useEffect(() => {
    getActiveGifts()
      .then((serverGifts) => {
        if (serverGifts && serverGifts.length > 0) {
          const mapped = serverGifts.map((g: any) => ({
            id: g._id,
            label: g.name,
            name: g.name,
            icon: 'gift',
            price: g.price,
            color: '#f423a0',
            imageUrl: g.imageUrl,
            animationUrl: g.animationUrl,
          }));
          setActiveGiftsList(mapped);
          setSelectedGift(mapped[0]);
        }
      })
      .catch(console.error);

    getStoreItems().then((items) => {
      if (items) setStoreItems(items);
    }).catch(console.error);
  }, []);
  const [chatFeed, setChatFeed] = useState<any[]>([{ sender: { displayName: 'System' }, text: 'Welcome to the room. Be kind and have fun.' }]);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [broadcastDetails, setBroadcastDetails] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const cameraRef = useRef<AgoraVideoViewRef>(null);
  const { user } = useAuth();
  
  const pulse = useMemo(() => new Animated.Value(1), []);
  React.useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true })])).start(); }, [pulse]);
  
  React.useEffect(() => {
    if (!broadcastId) return;
    let isMounted = true;
    
    getBroadcastById(broadcastId).then(data => {
      if (isMounted && data) setBroadcastDetails(data);
    }).catch(console.error);
    
    let durationTimer = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    
    const handleViewerCount = (count: number) => setViewerCount(count);
    const handleNewMessage = (msg: any) => {
      setChatFeed(prev => [...prev, { sender: msg.sender || { displayName: 'User', currentLevel: 1 }, text: msg.text }].slice(-12));
    };
    const handleBroadcastEnded = (data?: any) => {
      Keyboard.dismiss();
      AsyncStorage.removeItem('active-broadcast').catch(() => {});
      const msg =
        data?.reason === 'admin_forced'
          ? 'تم إنهاء هذا البث بواسطة إدارة التطبيق'
          : 'انتهى البث المباشر';
      Alert.alert('تنبيه', msg, [{ text: 'حسناً' }]);
      onClose();
    };
    const handleBroadcasterDisconnected = () => {
      setChatFeed(prev => [...prev, `Broadcaster disconnected...`].slice(-8));
    };
    const handleBroadcasterReconnected = () => {
      setChatFeed(prev => [...prev, `Broadcaster reconnected!`].slice(-8));
    };
    const handleGiftReceived = (data: any) => {
      setSelectedGift(data.gift);
      setShowGift(true);
      setTimeout(() => setShowGift(false), 1600);
    };
    const handleEntryEffect = (data: any) => {
      setEntryEffects(prev => [...prev, data]);
      setTimeout(() => setEntryEffects(prev => prev.filter(e => e !== data)), 4000);
    };
    const handleLevelUp = (data: any) => {
      setLevelUpEvents(prev => [...prev, data]);
      setTimeout(() => setLevelUpEvents(prev => prev.filter(e => e !== data)), 4000);
    };

    socketService.connect().then(() => {
      if (!isMounted) return;
      socketService.joinRoom(broadcastId);
      socketService.on('viewerCount', handleViewerCount);
      socketService.on('newMessage', handleNewMessage);
      socketService.on('broadcastEnded', handleBroadcastEnded);
      socketService.on('broadcasterDisconnected', handleBroadcasterDisconnected);
      socketService.on('broadcasterReconnected', handleBroadcasterReconnected);
      socketService.on('giftReceived', handleGiftReceived);
      socketService.on('userEntryEffect', handleEntryEffect);
      socketService.on('levelUp', handleLevelUp);
    });

    let heartbeatTimer: any;
    if (isBroadcaster) {
      heartbeatTimer = setInterval(() => {
        sendHeartbeat(broadcastId).catch(console.error);
      }, 30000);
    }

    return () => {
      isMounted = false;
      if (broadcastId) socketService.leaveRoom(broadcastId);
      
      socketService.off('viewerCount', handleViewerCount);
      socketService.off('newMessage', handleNewMessage);
      socketService.off('broadcastEnded', handleBroadcastEnded);
      socketService.off('broadcasterDisconnected', handleBroadcasterDisconnected);
      socketService.off('broadcasterReconnected', handleBroadcasterReconnected);
      socketService.off('giftReceived', handleGiftReceived);
      socketService.off('userEntryEffect', handleEntryEffect);
      socketService.off('levelUp', handleLevelUp);

      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (durationTimer) clearInterval(durationTimer);
    };
  }, [broadcastId, isBroadcaster, onClose]);

  const handleClose = () => {
    Keyboard.dismiss();
    if (isBroadcaster) {
      Alert.alert(
        'End Broadcast',
        'Are you sure you want to end your live broadcast?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'End', 
            style: 'destructive',
            onPress: () => {
              if (broadcastId) {
                endBroadcast(broadcastId)
                  .then(() => AsyncStorage.removeItem('active-broadcast'))
                  .catch(console.error);
              }
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  const handleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    cameraRef.current?.muteAudio(newMuted);
  };
  
  const formatDuration = `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`;
  const scoreTotal = Math.max(pkScores.left + pkScores.right, 1);
  const formatTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const sendSelectedGift = () => {
    if (broadcastId && sendGift(selectedGift.price)) {
      socketService.sendGift(broadcastId, selectedGift);
      // We don't show animation here, we rely on the socket event to trigger it for everyone!
    }
  };
  const sendMessage = () => {
    if (broadcastId && chatMessage.trim()) {
      socketService.sendMessage(broadcastId, chatMessage);
      setChatMessage('');
    }
  };
  const shareRoom = () => { Share.share({ message: 'Join me in StreamZone live: https://streamzone.example/live' }); };
  if (mode === 'voice') return <VoiceRoom palette={palette} onClose={onClose} />;
  if (mode === 'multi') return <MultiLiveRoom palette={palette} onClose={onClose} />;
  return (
    <View style={{ flex: 1, backgroundColor: '#17071d' }}>
      <StatusBar style="light" />
      {mode === 'pk' ? (
        <View style={styles.pkVideoRow}>
          <Image source={streamParty} style={styles.pkImage} />
          <Image source={streamHost} style={styles.pkImage} />
          <View style={styles.pkLabel}><Text style={styles.pkLabelText}>PK  {formatTimer}</Text></View>
        </View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          {broadcastId && channelName ? (
            <AgoraVideoView ref={cameraRef} broadcastId={broadcastId} channelName={channelName} isBroadcaster={isBroadcaster} />
          ) : (
            <ImageBackground source={streamParty} style={styles.roomImage}>
              <LinearGradient colors={['rgba(16,3,24,0.35)', 'rgba(17,5,27,0.96)']} style={StyleSheet.absoluteFillObject} />
            </ImageBackground>
          )}
          {/* Overlay gradient so UI is legible */}
          <LinearGradient colors={['rgba(16,3,24,0.3)', 'transparent', 'rgba(17,5,27,0.8)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        </View>
      )}
      <View style={[styles.roomTop, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} style={styles.roomClose}>
          <Icon name="chevron-back" size={25} color="#fff" />
        </Pressable>
        <Avatar uri={broadcastDetails?.broadcaster?.avatarUrl || avatarImages[1]} size={40} ring />
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={styles.roomHost} numberOfLines={1}>{broadcastDetails?.broadcaster?.displayName || broadcastDetails?.broadcaster?.username || channelName || 'Broadcaster'}</Text>
          <Text style={styles.roomHostMeta} numberOfLines={1}>{broadcastDetails?.title || 'Live'} • {formatDuration}</Text>
        </View>
        <View style={[styles.viewerStack, { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8, flexDirection: 'row', alignItems: 'center' }]}>
          <Icon name="people" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{viewerCount}</Text>
        </View>
        {isBroadcaster && (
          <Pressable onPress={() => cameraRef.current?.switchCamera()} style={styles.roomClose}>
            <Icon name="camera-reverse-outline" size={21} color="#fff" />
          </Pressable>
        )}
        <Pressable onPress={handleClose} style={styles.roomClose}>
          <Icon name="close" size={23} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.roomChat}>
        {/* Entry Effects */}
        {entryEffects.map((eff, index) => {
          const item = storeItems.find((i) => i._id === eff.entryEffectId);
          return (
            <Animated.View key={`entry-${index}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(233,184,36,0.2)', padding: 8, borderRadius: 20, marginBottom: 8, alignSelf: 'flex-start' }}>
              {item && item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: 40, height: 40, marginRight: 8, resizeMode: 'contain' }} />
              ) : (
                <Icon name="car" size={24} color={palette.gold} style={{ marginRight: 8 }} />
              )}
              <Text style={{ color: palette.gold, fontWeight: 'bold', fontSize: 13 }}>{eff.user?.displayName || 'User'} entered the room!</Text>
            </Animated.View>
          );
        })}

        {/* Level Up Events */}
        {levelUpEvents.map((evt, index) => (
          <Animated.View key={`lvl-${index}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244,35,160,0.2)', padding: 8, borderRadius: 20, marginBottom: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: palette.primary }}>
            <Icon name="arrow-up-circle" size={24} color={palette.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{evt.userId === user?._id ? 'You' : 'User'} leveled up to {evt.currentLevel?.level || evt.currentLevel}!</Text>
          </Animated.View>
        ))}

        {chatFeed.map((item, index) => {
          const isSystem = item.sender?.displayName === 'System';
          const hasBubble = !!item.sender?.activeChatBubble;
          const levelBadgeUrl = item.sender?.levelBadgeUrl;
          const currentLevel = item.sender?.currentLevel;

          return (
            <View
              key={`${index}`}
              style={[
                styles.roomChatBubble,
                isSystem && { backgroundColor: 'rgba(53,22,73,0.82)' },
                hasBubble && { borderColor: palette.primary, borderWidth: 1, backgroundColor: 'rgba(16,3,24,0.7)' },
                { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }
              ]}
            >
              {!isSystem && levelBadgeUrl ? (
                <Image source={{ uri: levelBadgeUrl }} style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6 }} />
              ) : !isSystem && currentLevel ? (
                <View style={{ backgroundColor: palette.purple, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginRight: 6 }}>
                  <Text style={{ fontSize: 10, color: '#fff', fontWeight: '800' }}>Lv.{currentLevel}</Text>
                </View>
              ) : null}
              <Text style={[styles.roomChatText, { color: isSystem ? palette.primary : palette.gold, fontWeight: '700', marginRight: 4 }]}>
                {item.sender?.displayName}:
              </Text>
              <Text style={[styles.roomChatText, hasBubble && { color: '#fff' }]}>{item.text}</Text>
            </View>
          );
        })}
      </View>
      {showGift && selectedGift ? (
        <Animated.View style={[styles.giftSent, { transform: [{ scale: pulse }] }]}>
          {selectedGift.imageUrl ? (
            <Image source={{ uri: selectedGift.imageUrl }} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
          ) : (
            <Icon name={(selectedGift.icon || 'gift') as IconName} size={42} color={selectedGift.color || '#f423a0'} />
          )}
          <Text style={styles.giftSentText}>{selectedGift.label || selectedGift.name || 'Gift'} sent</Text>
        </Animated.View>
      ) : null}
      {winner ? <View style={styles.winnerOverlay}><View style={styles.confettiLayer}>{Array.from({ length: 16 }).map((_, index) => <ConfettiPiece key={index} index={index} />)}</View><Icon name="trophy" size={52} color={palette.gold} /><Text style={styles.winnerTitle}>Winner</Text><Text style={styles.winnerCopy}>{pkScores.left >= pkScores.right ? 'Saniya lieo takes the round' : 'Andrew Filder takes the round'}</Text><PillButton label="Back to room" onPress={() => { setWinner(false); if (mode === 'pk') { resetPkScores(); setSecondsLeft(124); } }} palette={palette} /></View> : null}
      {moreOpen ? <View style={[styles.moreSheet, { backgroundColor: palette.panel }]}><View style={styles.sheetHandle} /><Text style={[styles.sheetTitle, { color: palette.foreground }]}>Room options</Text>{([['flag', 'Report'], ['ban', 'Block'], ['share-social-outline', 'Share']] as const).map(([icon, label]) => <Pressable key={label} onPress={() => { setMoreOpen(false); if (label === 'Share') shareRoom(); }} style={styles.moreItem}><Icon name={icon as IconName} size={20} color={palette.primary} /><Text style={[styles.moreText, { color: palette.foreground }]}>{label}</Text><Icon name="chevron-forward" size={17} color={palette.mutedForeground} /></Pressable>)}</View> : null}
      {giftOpen ? (
        <View style={[styles.giftSheet, { backgroundColor: palette.panel }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.giftSheetHeader}>
            <Text style={[styles.sheetTitle, { color: palette.foreground }]}>Send a gift</Text>
            <Text style={[styles.coinBalance, { color: palette.gold }]}>
              <Icon name="diamond" size={13} color={palette.gold} /> {coins.toLocaleString()}
            </Text>
            <Pressable onPress={() => setGiftOpen(false)}>
              <Icon name="close" size={21} color={palette.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.giftGrid}>
            {activeGiftsList.map((gift) => (
              <Pressable
                key={gift.id}
                onPress={() => setSelectedGift(gift)}
                style={[
                  styles.giftItem,
                  selectedGift?.id === gift.id && {
                    borderColor: palette.primary,
                    backgroundColor: palette.secondary,
                  },
                ]}
              >
                {gift.imageUrl ? (
                  <Image source={{ uri: gift.imageUrl }} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                ) : (
                  <Icon name={(gift.icon || 'gift') as IconName} size={27} color={gift.color || '#f423a0'} />
                )}
                <Text style={[styles.giftLabel, { color: palette.mutedText }]} numberOfLines={1}>
                  {gift.label || gift.name}
                </Text>
                <Text style={[styles.giftPrice, { color: palette.gold }]}>{gift.price}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={sendSelectedGift} style={[styles.fullButton, { backgroundColor: palette.primary }]}>
            <Text style={styles.fullButtonText}>Send {selectedGift?.label || selectedGift?.name || 'Gift'}</Text>
            <Icon name="paper-plane" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.roomBottom, { paddingBottom: insets.bottom + 9 }]}>
          <View style={[styles.roomInput, { backgroundColor: 'rgba(61,31,74,0.86)' }]}>
            <TextInput value={chatMessage} onChangeText={setChatMessage} onSubmitEditing={sendMessage} placeholder="Type something..." placeholderTextColor="rgba(255,255,255,0.6)" style={styles.roomInputText} />
          </View>
          {!isBroadcaster && (
            <Pressable onPress={() => setGiftOpen(true)} style={styles.roomAction}>
              <Icon name="gift" size={24} color={palette.gold} />
            </Pressable>
          )}
          {isBroadcaster && (
            <Pressable onPress={handleMute} style={styles.roomAction}>
              <Icon name={muted ? 'mic-off' : 'mic'} size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function MultiLiveRoom({ palette, onClose }: { palette: ThemeColors; onClose: () => void }) {
  const seats = [avatarImages[0], avatarImages[1], '', avatarImages[2], avatarImages[3], '', avatarImages[4], avatarImages[5], ''];
  return (
    <View style={{ flex: 1, backgroundColor: '#1b0b32' }}><StatusBar style="light" /><View style={styles.multiTop}><Pressable onPress={onClose}><Icon name="chevron-back" size={25} color="#fff" /></Pressable><View style={{ flex: 1 }}><Text style={styles.roomHost}>The Glam</Text><Text style={styles.roomHostMeta}>ID: 235166</Text></View><View style={styles.roomViewer}><Icon name="person" size={14} color="#fff" /><Text style={styles.roomViewerText}>368</Text></View><Pressable onPress={onClose}><Icon name="close" size={24} color="#fff" /></Pressable></View><View style={styles.multiRoomBody}><View style={styles.multiCoin}><Icon name="diamond" size={16} color={palette.gold} /><Text style={styles.multiCoinText}>4836</Text></View><Text style={styles.multiRoomName}>The Glam Lounge</Text><View style={styles.seatGrid}>{seats.map((uri, index) => <View key={index} style={styles.seat}><View style={[styles.seatCircle, { backgroundColor: uri ? palette.secondary : 'rgba(255,255,255,0.12)', borderColor: uri ? palette.primary : 'transparent' }]}>{uri ? <Avatar uri={uri} size={58} /> : <Icon name={index === 5 ? 'gift' : 'add'} size={25} color={index === 5 ? palette.gold : '#c3abd4'} />}</View><Text style={styles.seatName}>{uri ? ['Emily', 'Amelia', 'Sophia', 'Camila', 'Aurora', 'Avery'][index % 6] : `${index + 1}`}</Text></View>)}</View><View style={styles.announcement}><Text style={styles.announcementText}>Room name : Welcome to join the live. Any content related to violence, gambling, illegal dealing will be banned.</Text></View><View style={styles.multiChat}><Text style={styles.multiChatName}>Victoria Adams</Text><Text style={styles.multiChatBubble}>Hey everyone, are we still meeting at 3 PM?</Text><Text style={styles.multiChatName}>Caleb Cooper</Text><Text style={styles.multiChatBubble}>Yes, that works for me. I just need to finish one quick task.</Text></View></View><View style={styles.multiBottom}><View style={styles.roomInput}><Text style={styles.roomInputText}>Type Something...</Text></View><Icon name="paper-plane" size={25} color={palette.primary} /><Icon name="game-controller" size={23} color={palette.gold} /><Icon name="gift" size={25} color={palette.primary} /></View></View>
  );
}

function VoiceRoom({ palette, onClose }: { palette: ThemeColors; onClose: () => void }) {
  const activeSpeaker = useStreamStore((state) => state.sentGiftCount % 3);
  return (
    <View style={{ flex: 1, backgroundColor: '#190a2e' }}><StatusBar style="light" /><View style={styles.voiceTop}><Pressable onPress={onClose}><Icon name="chevron-back" size={25} color="#fff" /></Pressable><View style={{ flex: 1 }}><Text style={styles.roomHost}>The Glow Room</Text><Text style={styles.roomHostMeta}>Talk, laugh, and meet new people</Text></View><Pressable><Icon name="share-social-outline" size={23} color="#fff" /></Pressable><Pressable onPress={onClose}><Icon name="close" size={24} color="#fff" /></Pressable></View><View style={styles.voiceBody}><View style={styles.voiceTopic}><Text style={styles.voiceTopicLabel}>ROOM TOPIC</Text><Text style={styles.voiceTopicText}>Soft mornings & good energy</Text></View><Animated.View style={[styles.hostSeat, { borderColor: palette.primary, transform: [{ scale: activeSpeaker === 0 ? 1.06 : 1 }] }]}><Avatar uri={avatarImages[0]} size={88} /><View style={styles.speakingDot}><Icon name="mic" size={12} color="#fff" /></View></Animated.View><Text style={styles.voiceHostLabel}>Host  ·  Saniya</Text><View style={styles.voiceSeats}>{avatarImages.slice(1, 7).map((uri, index) => <View key={uri} style={styles.voiceSeat}><Animated.View style={[styles.voiceAvatarRing, { borderColor: index === activeSpeaker - 1 ? palette.primary : 'transparent' }]}><Avatar uri={uri} size={57} /></Animated.View><Text style={styles.voiceSeatName}>{['Emily', 'Amelia', 'Sophia', 'Camila', 'Avery', 'Open seat'][index]}</Text></View>)}</View><View style={styles.voiceChat}><Text style={styles.roomChatText}>Welcome to the room · be kind and have fun.</Text><Text style={styles.roomChatText}>Alexa: This topic is so good today.</Text></View></View><View style={styles.voiceBottom}><Pressable style={styles.voiceControl}><Icon name="hand-left-outline" size={23} color="#fff" /><Text style={styles.voiceControlText}>Raise</Text></Pressable><Pressable style={styles.voiceControl}><Icon name="people-outline" size={23} color="#fff" /><Text style={styles.voiceControlText}>Guests</Text></Pressable><Pressable style={[styles.voiceMic, { backgroundColor: palette.primary }]}><Icon name="mic-off" size={24} color="#fff" /></Pressable><Pressable style={styles.voiceControl}><Icon name="gift-outline" size={23} color={palette.gold} /><Text style={styles.voiceControlText}>Gift</Text></Pressable></View></View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  return <View style={{ width: 8, height: 8, backgroundColor: ['#ff0', '#f0f', '#0ff'][index % 3], position: 'absolute', top: Math.random() * 100, left: Math.random() * 100 }} />;
}

export default function StreamZoneApp() {
  const { width } = useWindowDimensions();
  const { user, isInitializing } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [roomMode, setRoomMode] = useState<RoomMode>('room');
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');
  const theme = useStreamStore((state) => state.theme);
  const activeTab = useStreamStore((state) => state.activeTab);
  const setActiveTab = useStreamStore((state) => state.setActiveTab);
  const toggleTheme = useStreamStore((state) => state.toggleTheme);
  const palette = theme === 'dark' ? colors.dark : colors.light;
  const compact = width < 390;
  
  const [activeBroadcastId, setActiveBroadcastId] = useState<string | undefined>();
  const [activeChannelName, setActiveChannelName] = useState<string | undefined>();
  const [activeConversationId, setActiveConversationId] = useState<string>('');

  const go = (next: Screen) => { setPreviousScreen(screen); setScreen(next); };
  const openRoom = (mode: RoomMode, broadcastId?: string, channelName?: string) => { 
    setRoomMode(mode); 
    setActiveBroadcastId(broadcastId);
    setActiveChannelName(channelName);
    setPreviousScreen(screen); 
    setScreen(mode); 
  };
  const goBack = () => setScreen(previousScreen === 'room' || previousScreen === 'pk' || previousScreen === 'multi' || previousScreen === 'voice' ? 'home' : previousScreen);
  const selectTab = (tab: 'home' | 'rooms' | 'messages' | 'profile') => { setActiveTab(tab); setScreen(tab === 'home' ? 'home' : tab); };
  const screenContent = screen === 'home' ? <HomeScreen palette={palette} onNavigate={go} onOpenRoom={openRoom} /> : screen === 'feed' ? <FeedScreen palette={palette} onBack={() => selectTab('home')} onOpenRoom={openRoom} /> : screen === 'messages' ? <MessagesScreen palette={palette} onOpenChat={(id) => { setActiveConversationId(id); go('chat'); }} /> : screen === 'profile' ? <ProfileScreen palette={palette} onNavigate={go} onTheme={toggleTheme} /> : screen === 'wallet' ? <WalletScreen palette={palette} onBack={goBack} onNavigate={go} /> : screen === 'income' ? <IncomeScreen palette={palette} onBack={goBack} /> : screen === 'store' ? <StoreScreen palette={palette} onBack={goBack} /> : screen === 'free' ? <FreeDiamondsScreen palette={palette} onBack={goBack} /> : screen === 'ranking' ? <RankingScreen palette={palette} onBack={goBack} /> : screen === 'auth' ? <AuthScreen palette={palette} onBack={goBack} onComplete={() => go('setup')} /> : screen === 'setup' ? <SetupScreen palette={palette} onBack={goBack} onDone={() => setScreen('home')} /> : screen === 'chat' ? <ChatScreen palette={palette} conversationId={activeConversationId} onBack={goBack} /> : <LiveRoom palette={palette} mode={roomMode} broadcastId={activeBroadcastId} channelName={activeChannelName} onClose={() => setScreen(previousScreen === 'feed' ? 'feed' : 'home')} />;
  const showNav = ['home', 'rooms', 'messages', 'profile'].includes(screen);
  
  if (isInitializing) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }, compact && { paddingHorizontal: 0 }]}>
        <AuthScreen palette={palette} onBack={undefined as any} onComplete={() => setScreen('setup')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }, compact && { paddingHorizontal: 0 }]}>
      {screenContent}
      {showNav ? <BottomNav activeTab={activeTab} palette={palette} onTab={selectTab} onGoLive={() => openRoom('room')} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '800', fontStyle: 'italic' },
  wordmark: { fontSize: 12, letterSpacing: 1.6, fontWeight: '800' },
  homeTop: { paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: { height: 44, marginHorizontal: 16, marginTop: 15, borderRadius: 23, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  banner: { width: 'auto', height: 140, marginHorizontal: 16, marginTop: 16, borderRadius: 19 },
  chipScroll: { gap: 8, paddingHorizontal: 16, paddingVertical: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  rowAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rowActionText: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  liveCard: { width: '48.2%', height: 230, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  liveCardImage: { width: '100%', height: '100%' },
  liveBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  viewerBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: 'rgba(17,5,26,0.55)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewerText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  liveCardBottom: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  liveName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  liveMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  liveHandle: { color: 'rgba(255,255,255,0.78)', fontSize: 10 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 78, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 9, zIndex: 20 },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 62, gap: 4 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  liveButton: { width: 61, height: 61, borderRadius: 31, borderWidth: 2, padding: 5, marginTop: -20 },
  liveButtonInner: { width: '100%', height: '100%', borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 22, gap: 6 },
  pillText: { fontWeight: '700' },
  header: { minHeight: 86, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { width: 76, minHeight: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  iconButton: { width: 36, height: 36, justifyContent: 'center' },
  battlePreview: { borderRadius: 19, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13 },
  battleAvatars: { flexDirection: 'row', alignItems: 'center' },
  vsText: { fontSize: 14, fontWeight: '900', marginHorizontal: 7 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardMeta: { fontSize: 11, marginTop: 5 },
  partyCard: { borderRadius: 17, minHeight: 88, marginBottom: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  partyImage: { width: 70, height: 72, borderRadius: 12 },
  partyCopy: { flex: 1 },
  partyName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  partyDescription: { color: 'rgba(255,255,255,0.84)', fontSize: 9, lineHeight: 13, marginTop: 4 },
  partyPeople: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  partyViewers: { color: '#fff', fontSize: 10, marginLeft: 7 },
  roomType: { position: 'absolute', top: 12, right: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  roomTypeText: { color: '#fff', fontSize: 9 },
  feedHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedTabs: { flexDirection: 'row', gap: 22 },
  feedTab: { fontSize: 19, fontWeight: '800' },
  feedUnderline: { height: 2, width: 34, marginTop: 5, borderRadius: 2 },
  post: { marginBottom: 17 },
  postAuthor: { paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  postName: { fontSize: 13, fontWeight: '800' },
  postCountry: { fontSize: 11, marginTop: 3 },
  postImage: { width: '100%', height: 385 },
  postActions: { paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 11 },
  caption: { fontSize: 11, lineHeight: 17, paddingHorizontal: 16, paddingTop: 8 },
  videoPreview: { marginHorizontal: 12, height: 650, borderRadius: 20, overflow: 'hidden' },
  videoImage: { flex: 1, justifyContent: 'flex-end' },
  videoImageRadius: { borderRadius: 20 },
  videoSideActions: { position: 'absolute', right: 17, bottom: 140, alignItems: 'center', gap: 8 },
  videoSideText: { color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 12 },
  videoCaption: { padding: 20 },
  videoName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  videoHandle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 3 },
  videoQuestion: { color: '#fff', fontSize: 12, marginTop: 18 },
  profileTop: { paddingHorizontal: 16, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileIdentity: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileName: { fontSize: 19, fontWeight: '800' },
  profileId: { fontSize: 11, marginTop: 4 },
  levelRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  levelPill: { color: '#fff', fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontWeight: '800' },
  stats: { marginHorizontal: 16, borderRadius: 17, borderWidth: 1, flexDirection: 'row', paddingVertical: 15 },
  stat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: 'rgba(150,120,170,0.2)' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 5 },
  diamondCard: { margin: 16, height: 88, borderRadius: 17, overflow: 'hidden', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  diamondIcon: { width: 58, alignItems: 'center' },
  diamondLabel: { color: '#fff', fontSize: 11 },
  diamondAmount: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 },
  walletButton: { marginLeft: 'auto', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 3 },
  walletButtonText: { color: '#851dd3', fontSize: 11, fontWeight: '800' },
  featureSection: { marginHorizontal: 16, marginBottom: 14, padding: 15, borderRadius: 17, borderWidth: 1 },
  featureTitle: { fontSize: 15, fontWeight: '800', marginBottom: 15 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 17 },
  featureItem: { width: '25%', alignItems: 'center', gap: 6 },
  featureIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  featureLabel: { fontSize: 9, textAlign: 'center', lineHeight: 12 },
  signOut: { marginHorizontal: 16, minHeight: 48, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  signOutText: { fontWeight: '700', fontSize: 13 },
  messageHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 22, fontWeight: '900' },
  conversation: { marginHorizontal: 12, marginVertical: 5, padding: 11, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 11 },
  conversationName: { fontSize: 14, fontWeight: '800' },
  conversationMessage: { fontSize: 11, marginTop: 5 },
  conversationRight: { alignItems: 'flex-end', gap: 7 },
  unread: { minWidth: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  conversationTime: { fontSize: 9 },
  balanceCard: { minHeight: 127, borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 16 },
  balanceGem: { width: 78, alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 11 },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  walletActions: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  planCard: { minHeight: 141, borderRadius: 20, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden', position: 'relative' },
  bestPlan: { position: 'absolute', top: 0, left: 0, backgroundColor: '#ffd23f', paddingHorizontal: 9, paddingVertical: 5, borderBottomRightRadius: 11 },
  bestPlanText: { fontSize: 8, color: '#5c1838', fontWeight: '900' },
  planEyebrow: { color: '#fff', fontSize: 10 },
  planValue: { color: '#ffd83e', fontSize: 24, fontWeight: '900', marginTop: 4 },
  planPrice: { backgroundColor: '#ff9416', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  planPriceText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  planFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, backgroundColor: 'rgba(255,129,13,0.95)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  planFooterText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  coinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  coinPackage: { width: '31.6%', minHeight: 128, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5, overflow: 'hidden' },
  popularTag: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 5, paddingVertical: 4, borderBottomLeftRadius: 8 },
  popularTagText: { color: '#5e1834', fontSize: 6, fontWeight: '900' },
  coinAmount: { fontSize: 12, fontWeight: '900' },
  coinPrice: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginTop: 3 },
  coinPriceText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1 },
  historyIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  historyLabel: { fontSize: 12, fontWeight: '700' },
  historyDetail: { fontSize: 10, marginTop: 4 },
  historyAmount: { fontSize: 12, fontWeight: '800' },
  incomeCard: { minHeight: 182, borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incomeValue: { color: '#fff', fontSize: 40, fontWeight: '900', marginVertical: 9 },
  conversion: { backgroundColor: '#fff', borderRadius: 11, paddingHorizontal: 15, paddingVertical: 9 },
  conversionText: { color: '#8122d2', fontWeight: '800', fontSize: 13 },
  rCoin: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#d39cff', backgroundColor: '#7c29d3', alignItems: 'center', justifyContent: 'center' },
  rCoinText: { color: '#fff', fontSize: 48, fontWeight: '900' },
  formLabel: { fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 25 },
  withdrawInput: { height: 57, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  withdrawText: { flex: 1, fontSize: 13 },
  withdrawAmount: { fontSize: 20, fontWeight: '800' },
  helperText: { fontSize: 10, textAlign: 'right', marginTop: 7 },
  fullButton: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 13 },
  fullButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  statusText: { textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 14 },
  explanation: { fontSize: 12, lineHeight: 20 },
  segmented: { borderRadius: 23, padding: 4, flexDirection: 'row', marginBottom: 18 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 19 },
  segmentText: { fontSize: 12, fontWeight: '800' },
  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  storeItem: { width: '48.3%', borderRadius: 17, padding: 9, alignItems: 'center', minHeight: 207 },
  carImage: { width: '100%', height: 95 },
  storeName: { fontSize: 13, fontWeight: '800', marginTop: 6 },
  storePrice: { fontSize: 10, fontWeight: '800', marginTop: 7 },
  purchaseButton: { width: '100%', borderRadius: 17, paddingVertical: 9, alignItems: 'center', marginTop: 9 },
  purchaseText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  methodTitle: { fontSize: 16, fontWeight: '900' },
  methodCopy: { fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 10 },
  rewardCard: { borderRadius: 19, padding: 15, alignItems: 'center' },
  rewardArt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', height: 95 },
  rewardTitle: { fontSize: 18, fontWeight: '900', marginTop: 8 },
  rewardCopy: { fontSize: 12, marginTop: 2 },
  referralCard: { borderRadius: 19, padding: 16, alignItems: 'center' },
  referralTitle: { fontSize: 23, fontWeight: '900' },
  referralPeople: { height: 100, flexDirection: 'row', alignItems: 'center', gap: 15 },
  referralLabel: { alignSelf: 'flex-start', fontSize: 11, marginBottom: 7 },
  referralCode: { width: '100%', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 15 },
  codeText: { flex: 1, fontSize: 13, fontWeight: '900' },
  rankingTop: { height: 315, padding: 15 },
  rankTabs: { flexDirection: 'row', justifyContent: 'space-around' },
  rankTab: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  rankTabActive: { color: '#fff', fontWeight: '900', fontSize: 12 },
  podium: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: 18 },
  podiumPerson: { alignItems: 'center', width: '30%' },
  podiumName: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 6 },
  podiumValue: { color: '#ffd35c', fontSize: 10, marginTop: 3 },
  rankingRow: { minHeight: 60, borderRadius: 16, marginBottom: 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankNumber: { width: 20, fontWeight: '900', fontSize: 16 },
  rankingName: { flex: 1, fontSize: 12, fontWeight: '700' },
  rankingValue: { fontSize: 11, fontWeight: '800' },
  authContainer: { flexGrow: 1, padding: 24, paddingTop: 80, alignItems: 'center' },
  authBack: { alignSelf: 'flex-start', marginBottom: 35 },
  authTitle: { fontSize: 29, fontWeight: '900', marginTop: 32 },
  authCopy: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, maxWidth: 290 },
  authInput: { width: '100%', minHeight: 54, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 },
  authInputText: { flex: 1, fontSize: 14 },
  authPrimary: { width: '100%', minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 14 },
  authPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  orRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 25 },
  orLine: { height: 1, flex: 1 },
  orText: { fontSize: 10 },
  socialRow: { width: '100%', flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, borderRadius: 15, borderWidth: 1, minHeight: 49, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  socialText: { fontSize: 13, fontWeight: '700' },
  switchAuth: { fontSize: 13, fontWeight: '800', marginTop: 27 },
  setupEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  setupTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  setupAvatar: { alignSelf: 'center', marginVertical: 25, position: 'relative' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#17091f' },
  inputLabel: { fontSize: 13, fontWeight: '800', marginTop: 14, marginBottom: 8 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderChip: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  genderText: { fontSize: 11, fontWeight: '700' },
  chatHeaderActions: { flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'flex-end' },
  chatContent: { padding: 16, paddingBottom: 20 },
  todayPill: { alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 22 },
  todayText: { fontSize: 10 },
  chatBubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, marginBottom: 11 },
  chatBubble: { maxWidth: '74%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  chatBubbleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  chatPhoto: { width: 140, height: 166, borderRadius: 17, alignSelf: 'flex-end', marginTop: 6 },
  callIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(240,32,150,0.2)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  callTitle: { textAlign: 'center', fontWeight: '800', fontSize: 14, marginTop: 7 },
  callMeta: { textAlign: 'center', fontSize: 10, marginTop: 4 },
  quickReplies: { borderTopWidth: 1, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', gap: 7 },
  quickReply: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15 },
  quickReplyText: { fontSize: 11 },
  chatInputRow: { minHeight: 60, borderWidth: 1, borderRadius: 18, marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatInput: { flex: 1, fontSize: 13, paddingHorizontal: 6 },
  sendButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  roomImage: { ...StyleSheet.absoluteFillObject },
  roomTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 4 },
  roomClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(25,8,31,0.45)', alignItems: 'center', justifyContent: 'center' },
  roomHost: { color: '#fff', fontSize: 13, fontWeight: '800' },
  roomHostMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 3 },
  roomViewer: { backgroundColor: 'rgba(38,11,47,0.72)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 5 },
  roomViewerText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hostOverlay: { position: 'absolute', top: 105, left: 13, right: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hostPill: { backgroundColor: 'rgba(29,8,38,0.66)', borderRadius: 24, padding: 5, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  pkVideoRow: { position: 'absolute', top: 0, left: 0, right: 0, height: '54%', flexDirection: 'row' },
  pkImage: { width: '50%', height: '100%' },
  pkLabel: { position: 'absolute', top: 100, left: '43%', backgroundColor: 'rgba(18,5,25,0.85)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  pkLabelText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  pkScore: { position: 'absolute', top: '49%', left: 0, right: 0 },
  scoreLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 9 },
  scoreText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scoreTrack: { height: 10, flexDirection: 'row', marginTop: 4 },
  scoreFill: { height: '100%' },
  roomChat: { position: 'absolute', left: 13, bottom: 98, width: '75%', gap: 8 },
  roomChatBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(39,17,52,0.65)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  roomChatText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, lineHeight: 16 },
  giftSent: { position: 'absolute', top: '44%', alignSelf: 'center', alignItems: 'center' },
  giftSentText: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  winnerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(85,16,128,0.93)', alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  winnerTitle: { color: '#ffd35c', fontSize: 42, fontWeight: '900', marginTop: 12 },
  winnerCopy: { color: '#fff', fontSize: 14, marginBottom: 22, marginTop: 4 },
  roomBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(22,7,31,0.86)', paddingHorizontal: 12, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  roomInput: { flex: 1, height: 43, borderRadius: 22, paddingHorizontal: 15, justifyContent: 'center' },
  roomInputText: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  roomAction: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(71,33,83,0.9)', alignItems: 'center', justifyContent: 'center' },
  giftSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 16, paddingBottom: 25, zIndex: 10 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 14 },
  giftSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  coinBalance: { fontSize: 12, fontWeight: '800' },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  giftItem: { width: '30%', paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  giftLabel: { fontSize: 12, marginTop: 8 },
  giftPrice: { fontSize: 12, fontWeight: '700' },
  viewerStack: { flexDirection: 'row', alignItems: 'center' },
  viewerMore: { color: '#fff', fontSize: 12, marginLeft: 4 },
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  moreSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  moreItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  moreText: { flex: 1, fontSize: 16, marginLeft: 12 },
  multiTop: { paddingTop: 45, paddingHorizontal: 13, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  multiRoomBody: { flex: 1, paddingHorizontal: 13 },
  multiCoin: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  multiCoinText: { color: '#ffd35c', fontSize: 12, fontWeight: '900' },
  multiRoomName: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 14, marginBottom: 13 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 15 },
  seat: { width: '22%', alignItems: 'center' },
  seatCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  seatName: { color: '#fff', fontSize: 10, marginTop: 6 },
  announcement: { marginTop: 15, backgroundColor: 'rgba(153,78,186,0.28)', padding: 10, borderRadius: 9 },
  announcementText: { color: '#9ff1c9', fontSize: 10, lineHeight: 15 },
  multiChat: { marginTop: 12, gap: 6 },
  multiChatName: { color: '#2ed3ff', fontSize: 10 },
  multiChatBubble: { color: '#fff', fontSize: 10, backgroundColor: 'rgba(255,255,255,0.09)', alignSelf: 'flex-start', padding: 8, borderRadius: 8 },
  multiBottom: { backgroundColor: 'rgba(29,17,38,0.96)', minHeight: 65, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 15 },
  voiceTop: { paddingTop: 45, paddingHorizontal: 14, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceBody: { flex: 1, paddingHorizontal: 16, alignItems: 'center' },
  voiceTopic: { width: '100%', backgroundColor: 'rgba(147,71,186,0.22)', borderRadius: 13, padding: 12, marginTop: 8 },
  voiceTopicLabel: { color: '#bb96d0', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  voiceTopicText: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 5 },
  hostSeat: { marginTop: 25, width: 104, height: 104, borderRadius: 52, borderWidth: 3, padding: 5 },
  speakingDot: { position: 'absolute', bottom: -3, right: 3, width: 25, height: 25, borderRadius: 13, backgroundColor: '#38c96b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#190a2e' },
  voiceHostLabel: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 9 },
  voiceSeats: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 14, marginTop: 23 },
  voiceSeat: { width: '28%', alignItems: 'center' },
  voiceAvatarRing: { borderWidth: 2, borderRadius: 32, padding: 2 },
  voiceSeatName: { color: '#cbb0d7', fontSize: 10, marginTop: 5 },
  voiceChat: { width: '100%', marginTop: 20, gap: 5 },
  voiceBottom: { minHeight: 77, paddingHorizontal: 20, paddingBottom: 8, backgroundColor: 'rgba(28,12,39,0.96)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voiceControl: { alignItems: 'center', gap: 4 },
  voiceControlText: { color: '#d9c7e3', fontSize: 9 },
  voiceMic: { width: 49, height: 49, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
});