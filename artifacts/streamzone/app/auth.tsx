import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/StreamZoneApp';
import Ionicons from '@expo/vector-icons/Ionicons';
import colors from '@/constants/colors';
import { useAuth } from '@/store/authStore';

export default function AuthRoute() {
  const router = useRouter();
  const palette = colors.dark;
  const { googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await googleLogin();
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={styles.authContainer}>
        <View style={styles.header}>
           <View style={styles.logoContainer}>
             <Logo palette={palette} />
           </View>
           <Text style={[styles.authTitle, { color: palette.foreground }]}>Join the live side</Text>
           <Text style={[styles.authCopy, { color: palette.mutedText }]}>Create your profile and find your people.</Text>
        </View>

        {error ? (
           <Text style={{ color: palette.destructive, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        <Pressable onPress={() => router.push('/(auth)/phone')} style={[styles.authPrimary, { backgroundColor: palette.primary }]}>
          <Text style={styles.authPrimaryText}>Continue with Phone</Text>
          <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
        </Pressable>

        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: palette.border }]} />
          <Text style={[styles.orText, { color: palette.mutedForeground }]}>or continue with</Text>
          <View style={[styles.orLine, { backgroundColor: palette.border }]} />
        </View>

        <View style={styles.socialRow}>
          <Pressable 
            style={[styles.socialButton, { backgroundColor: palette.card, borderColor: palette.border, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#e94f5f" />
            <Text style={[styles.socialText, { color: palette.foreground }]}>Google</Text>
          </Pressable>
          
          <Pressable onPress={() => alert('Apple sign-in is not implemented yet.')} style={[styles.socialButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="logo-apple" size={20} color={palette.foreground} />
            <Text style={[styles.socialText, { color: palette.foreground }]}>Apple</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    padding: 24,
    paddingTop: 100,
  },
  header: {
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  authTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  authCopy: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  authPrimary: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  authPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 8,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
});