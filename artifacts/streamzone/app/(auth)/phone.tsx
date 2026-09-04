import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { auth } from '@/services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function PhoneScreen() {
  const router = useRouter();
  const palette = colors.dark;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>('SA');
  const [callingCode, setCallingCode] = useState('966');

  useEffect(() => {
    try {
      if (Platform.OS === 'web' && !(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
    } catch (err) {
      console.error('Failed to initialize recaptcha:', err);
    }
  }, []);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
    
    const formattedPhone = `+${callingCode}${phoneNumber.replace(/^0+/, '')}`;

    try {
      setIsLoading(true);
      setError('');
      
      if (Platform.OS === 'web') {
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        (window as any).confirmationResult = confirmationResult;
      } else {
        const { nativeSignInWithPhoneNumber } = require('@/services/nativeAuth');
        const confirmationResult = await nativeSignInWithPhoneNumber(formattedPhone);
        (global as any).nativeConfirmationResult = confirmationResult;
      }
      
      router.push('/(auth)/otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View id="recaptcha-container" />
      <Pressable onPress={() => router.back()} style={styles.authBack}>
        <Ionicons name="chevron-back" size={25} color={palette.foreground} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.foreground }]}>Phone Sign In</Text>
          <Text style={[styles.subtitle, { color: palette.mutedForeground }]}>
            Enter your phone number with country code and we'll send you a verification code.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.phoneInputContainer}>
            <View style={[styles.countryPickerContainer, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <CountryPicker
                withFilter
                withEmoji={false}
                withFlag
                withCallingCode
                withCallingCodeButton
                withAlphaFilter
                countryCode={countryCode}
                onSelect={(country: Country) => {
                  setCountryCode(country.cca2);
                  setCallingCode(country.callingCode[0]);
                }}
                renderFlagButton={({ onOpen }) => (
                  <Pressable onPress={onOpen} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter_500Medium', color: palette.foreground }}>
                      {countryCode}
                    </Text>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter_400Regular', color: palette.foreground }}>
                      +{callingCode}
                    </Text>
                  </Pressable>
                )}
                theme={{
                  primaryColor: palette.foreground,
                  primaryColorVariant: palette.mutedForeground,
                  backgroundColor: palette.card,
                  onBackgroundTextColor: palette.foreground,
                  fontSize: 16,
                  fontFamily: 'Inter_400Regular',
                  filterPlaceholderTextColor: palette.mutedForeground,
                  activeOpacity: 0.7,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="5X XXX XXXX"
                placeholderTextColor={palette.mutedForeground}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
                style={[styles.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.foreground }]}
              />
            </View>
          </View>
          
          <Pressable 
            onPress={handleSendCode} 
            disabled={isLoading}
            style={[styles.authPrimary, { backgroundColor: palette.primary, opacity: isLoading ? 0.7 : 1 }]}>
            <Text style={styles.authPrimaryText}>Send Code</Text>
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryPickerContainer: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
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
