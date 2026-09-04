import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useAuth } from '@/store/authStore';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function OtpScreen() {
  const router = useRouter();
  const palette = colors.dark;
  const { firebaseLogin } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    if (Platform.OS === 'web' && !(window as any).confirmationResult) {
      setError('Session error. Please try again.');
      return;
    }
    if (Platform.OS !== 'web' && !(global as any).nativeConfirmationResult) {
      setError('Session error. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      let idToken;
      if (Platform.OS === 'web') {
        const result = await (window as any).confirmationResult.confirm(code);
        idToken = await result.user.getIdToken();
      } else {
        const result = await (global as any).nativeConfirmationResult.confirm(code);
        idToken = await result.user.getIdToken();
      }
      await firebaseLogin(idToken);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Incorrect code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Pressable onPress={() => router.back()} style={styles.authBack}>
        <Ionicons name="chevron-back" size={25} color={palette.foreground} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.foreground }]}>Verification Code</Text>
          <Text style={[styles.subtitle, { color: palette.mutedForeground }]}>
            Enter the 6-digit code we sent to your phone.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <TextInput
            placeholder="123456"
            placeholderTextColor={palette.mutedForeground}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={[styles.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.foreground }]}
          />
          
          <Pressable 
            onPress={handleVerify} 
            disabled={isLoading}
            style={[styles.authPrimary, { backgroundColor: palette.primary, opacity: isLoading ? 0.7 : 1 }]}>
            <Text style={styles.authPrimaryText}>Verify</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  authBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    gap: 32,
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  authPrimary: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
