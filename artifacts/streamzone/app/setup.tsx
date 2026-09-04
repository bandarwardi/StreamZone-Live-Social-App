import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/authStore';
import colors from '@/constants/colors';
import { Header, Avatar, Icon } from '@/components/StreamZoneApp';
import { avatarImages } from '@/mock-data';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function SetupRoute() {
  const router = useRouter();
  const palette = colors.dark;
  const { user, completeProfile, uploadAvatar } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [gender, setGender] = useState(user?.gender || 'Woman');
  const [date, setDate] = useState(() => {
    return user?.birthdate ? new Date(user.birthdate) : new Date('2000-01-01T00:00:00');
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleDone = async () => {
    if (displayName.length < 3) {
      setError('Display name must be at least 3 characters');
      return;
    }
    if (username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
      setError('Username must be 3-20 chars: lowercase, numbers, and underscores only');
      return;
    }
    try {
      setLoading(true);
      setError('');
      
      if (avatarUri) {
        await uploadAvatar(avatarUri);
      }
      
      const birthdateStr = formatDate(date);
      await completeProfile({
        username,
        displayName,
        gender,
        birthdate: birthdateStr,
      });
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Failed to complete profile';
      if (err.response?.data?.message) {
        errorMessage = Array.isArray(err.response.data.message) 
          ? err.response.data.message[0] 
          : err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Header title="Profile setup" palette={palette} />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
        <Text style={[styles.setupEyebrow, { color: palette.primary }]}>MAKE IT YOURS</Text>
        <Text style={[styles.setupTitle, { color: palette.foreground }]}>Tell the room who you are.</Text>
        <Text style={[styles.authCopy, { color: palette.mutedText }]}>You can change these details any time from your profile.</Text>
        
        <View style={styles.setupAvatar}>
          <Avatar uri={avatarUri || user?.avatarUrl || avatarImages[0]} size={94} ring />
          <Pressable onPress={pickImage} style={[styles.cameraButton, { backgroundColor: palette.primary }]}>
            <Icon name="camera" size={16} color="#fff" />
          </Pressable>
        </View>

        {error ? <Text style={{ color: palette.destructive, marginBottom: 16 }}>{error}</Text> : null}

        <Text style={[styles.inputLabel, { color: palette.foreground }]}>Username</Text>
        <View style={[styles.authInput, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Icon name="at" size={18} color={palette.mutedForeground} />
          <TextInput 
            value={username} 
            onChangeText={setUsername} 
            placeholder="Your username" 
            placeholderTextColor={palette.mutedForeground} 
            style={[styles.authInputText, { color: palette.foreground }]} 
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={[styles.inputLabel, { color: palette.foreground }]}>Display Name</Text>
        <View style={[styles.authInput, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Icon name="person-outline" size={18} color={palette.mutedForeground} />
          <TextInput 
            value={displayName} 
            onChangeText={setDisplayName} 
            placeholder="Your display name" 
            placeholderTextColor={palette.mutedForeground} 
            style={[styles.authInputText, { color: palette.foreground }]} 
          />
        </View>

        <Text style={[styles.inputLabel, { color: palette.foreground }]}>Gender</Text>
        <View style={styles.genderRow}>
          {['Woman', 'Man'].map((item) => (
            <Pressable 
              key={item} 
              onPress={() => setGender(item)} 
              style={[styles.genderChip, { backgroundColor: gender === item ? palette.primary : palette.secondary }]}
            >
              <Text style={[styles.genderText, { color: gender === item ? '#fff' : palette.mutedText }]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.inputLabel, { color: palette.foreground }]}>Birthday</Text>
        <Pressable 
          style={[styles.authInput, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar-outline" size={18} color={palette.mutedForeground} />
          <Text style={[styles.authInputText, { color: palette.foreground }]}>
            {formatDate(date)}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <Pressable 
          onPress={handleDone} 
          disabled={loading}
          style={[styles.authPrimary, { backgroundColor: palette.primary, opacity: loading ? 0.7 : 1 }]}
        >
          <Text style={styles.authPrimaryText}>Save profile</Text>
          <Icon name="checkmark" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  setupEyebrow: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 8, marginTop: 12 },
  setupTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  authCopy: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, marginBottom: 16 },
  setupAvatar: { alignSelf: 'center', marginVertical: 16, position: 'relative' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  inputLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12, marginTop: 16 },
  authInput: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16 },
  authInputText: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Inter_500Medium' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  genderChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  genderText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  authPrimary: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  authPrimaryText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold', marginRight: 8 },
});