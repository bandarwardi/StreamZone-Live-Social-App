import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { BottomNav, Header, Avatar, Icon } from '@/components/StreamZoneApp';
import { useStreamStore } from '@/store/useStreamStore';
import { searchUsers } from '@/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RoomsRoute() {
  const router = useRouter();
  const activeTab = useStreamStore((state) => state.activeTab);
  const insets = useSafeAreaInsets();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsers(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    
    return () => clearTimeout(timeout);
  }, [query]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable 
      style={styles.userCard} 
      onPress={() => router.push({ pathname: '/user-profile/[id]', params: { id: item._id } })}
    >
      <Avatar uri={item.avatarUrl || 'https://i.pravatar.cc/150?u=' + item._id} size={50} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || item.username}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.dark.mutedForeground} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header title="Search & Connect" palette={colors.dark} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.dark.mutedForeground} />
          <TextInput 
            value={query} 
            onChangeText={setQuery} 
            placeholder="Search people..." 
            placeholderTextColor={colors.dark.mutedForeground} 
            style={styles.searchInput} 
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Icon name="close-circle" size={18} color={colors.dark.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.dark.primary} style={{ marginTop: 40 }} />
        ) : query.length > 0 && results.length === 0 ? (
          <Text style={styles.emptyText}>No users found.</Text>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              !query ? (
                <View style={styles.placeholderState}>
                  <Icon name="people" size={60} color={colors.dark.border} />
                  <Text style={styles.placeholderText}>Search for people to follow, message, or call.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
      
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <BottomNav 
          activeTab={activeTab} 
          palette={colors.dark} 
          onTab={(tab) => router.replace(`/(tabs)/${tab === 'home' ? '' : tab}` as never)} 
          onGoLive={() => router.push('/go-live')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.secondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.dark.foreground,
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: colors.dark.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    color: colors.dark.mutedForeground,
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    color: colors.dark.mutedForeground,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  placeholderState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  placeholderText: {
    color: colors.dark.mutedText,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },
});
