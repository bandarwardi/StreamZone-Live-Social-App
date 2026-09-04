import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import colors from '@/constants/colors';
import { Logo } from '@/components/StreamZoneApp';
import { useAuth } from '@/store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, user } = useAuth();
  
  useEffect(() => {
    if (isInitializing) return;
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/auth');
      } else if (!user?.isProfileComplete) {
        router.replace('/setup');
      } else {
        router.replace('/(tabs)');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isInitializing, user, router]);
  return <LinearGradient colors={[colors.dark.background, '#4d116a', colors.dark.background]} style={styles.root}><StatusBar style="light" /><Logo palette={colors.dark} /><Text style={styles.title}>STREAMZONE</Text><Text style={styles.subtitle}>Live beyond the ordinary</Text><View style={styles.loader}><View style={styles.loaderFill} /></View></LinearGradient>;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 3, marginTop: 24 },
  subtitle: { color: 'rgba(255,255,255,0.68)', fontSize: 12, marginTop: 8 },
  loader: { width: 90, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginTop: 34 },
  loaderFill: { width: '60%', height: '100%', backgroundColor: colors.dark.primary },
});