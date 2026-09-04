import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { auth } from '@/services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Platform } from 'react-native';
import { getFCMToken } from '@/services/pushNotifications';
import { getNativeAuth, getGoogleSignin, nativeGoogleCredential, nativeSignInWithCredential, nativeLinkWithCredential, nativeSignOut } from '@/services/nativeAuth';
import { useStreamStore } from '@/store/useStreamStore';
import { socketService } from '@/services/socketService';

type User = {
  _id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  phone?: string;
  phoneVerified?: boolean;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  displayName?: string;
  coins?: number;
  diamonds?: number;
  gender?: string;
  birthdate?: string;
  isProfileComplete?: boolean;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  firebaseLogin: (idToken: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  linkGoogle: () => Promise<void>;
  completeProfile: (data: any) => Promise<void>;
  updateProfile: (changes: Partial<User>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

declare var process: any;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Keep the demo logged in state in sync for now, so components that rely on useStreamStore works
  const setDemoLoggedIn = useStreamStore((state: any) => state.setLoggedIn);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        getGoogleSignin().configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        });
      } catch (e) {
        console.error('GoogleSignin configure error', e);
      }
    }

    AsyncStorage.getItem('livewave-access-token').then(async (token: string | null) => {
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
          setDemoLoggedIn(true);
          if (res.data) {
            useStreamStore.getState().setBalances({
              coins: res.data.coins ?? 0,
              diamonds: res.data.diamonds ?? 0,
            });
          }
          socketService.connect().catch((e) => console.error('Socket connect error on startup:', e));

          // Update push token
          getFCMToken().then(pushToken => {
            if (pushToken) api.patch('/users/push-token', { token: pushToken }).catch(() => {});
          });
        } catch (error) {
          await AsyncStorage.removeItem('livewave-access-token');
          await AsyncStorage.removeItem('livewave-refresh-token');
          setUser(null);
          setDemoLoggedIn(false);
          socketService.disconnect();
        }
      }
      setIsInitializing(false);
    });
  }, []);

  const firebaseLogin = async (idToken: string) => {
    try {
      const res = await api.post('/auth/firebase', { token: idToken });
      await AsyncStorage.setItem('livewave-access-token', res.data.accessToken);
      await AsyncStorage.setItem('livewave-refresh-token', res.data.refreshToken);
      const profileRes = await api.get('/users/me');
      setUser(profileRes.data);
      setDemoLoggedIn(true);
      if (profileRes.data) {
        useStreamStore.getState().setBalances({
          coins: profileRes.data.coins ?? 0,
          diamonds: profileRes.data.diamonds ?? 0,
        });
      }
      socketService.connect().catch((e) => console.error('Socket connect error on login:', e));

      // Update push token
      getFCMToken().then(pushToken => {
        if (pushToken) api.patch('/users/push-token', { token: pushToken }).catch(() => {});
      });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  };

  const googleLogin = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseIdToken = await result.user.getIdToken();
        await firebaseLogin(firebaseIdToken);
      } catch (error: any) {
        console.error('Firebase web google login failed', error);
        throw new Error(error.message || 'Firebase popup closed or failed.');
      }
    } else {
      try {
        await getGoogleSignin().hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await getGoogleSignin().signIn();
        if (!userInfo.data?.idToken) {
          throw new Error('No ID token present!');
        }
        
        const googleCredential = nativeGoogleCredential(userInfo.data.idToken);
        const userCredential = await nativeSignInWithCredential(googleCredential);
        
        const firebaseIdToken = await userCredential.user.getIdToken();
        await firebaseLogin(firebaseIdToken);
      } catch (error: any) {
        console.error('Firebase native google login failed', error);
        throw new Error(error.message || 'Google sign in failed.');
      }
    }
  };

  const completeProfile = async (data: any) => {
    const res = await api.put('/auth/complete-profile', data);
    setUser(res.data);
  };

  const updateProfile = async (changes: Partial<User>) => {
    try {
      const res = await api.patch('/users/me', changes);
      setUser(res.data);
    } catch (error) {
      console.error('Failed to update profile', error);
      throw error;
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(res.data);
    } catch (error) {
      console.error('Failed to upload avatar', error);
      throw error;
    }
  };

  const linkGoogle = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseIdToken = await result.user.getIdToken();
        
        const res = await api.post('/auth/firebase', { token: firebaseIdToken });
        await AsyncStorage.setItem('livewave-access-token', res.data.accessToken);
        await AsyncStorage.setItem('livewave-refresh-token', res.data.refreshToken);
        const profileRes = await api.get('/users/me');
        setUser(profileRes.data);
      } catch (error: any) {
        console.error('Firebase link google failed', error);
        throw new Error(error.message || 'Firebase popup closed or failed.');
      }
    } else {
      try {
        await getGoogleSignin().hasPlayServices({ showPlayServicesUpdateDialog: true });
        const userInfo = await getGoogleSignin().signIn();
        if (!userInfo.data?.idToken) {
          throw new Error('No ID token present!');
        }
        
        const googleCredential = nativeGoogleCredential(userInfo.data.idToken);
        let firebaseIdToken = '';
        const currentUser = getNativeAuth().currentUser;
        if (currentUser) {
           const userCredential = await nativeLinkWithCredential(googleCredential);
           firebaseIdToken = await userCredential.user.getIdToken();
        } else {
           const userCredential = await nativeSignInWithCredential(googleCredential);
           firebaseIdToken = await userCredential.user.getIdToken();
        }
        
        await firebaseLogin(firebaseIdToken);
      } catch (error: any) {
        console.error('Firebase native link google failed', error);
        throw new Error(error.message || 'Google sign in failed.');
      }
    }
  };

  const logout = async () => {
    try {
      if (Platform.OS === 'web') {
        await auth.signOut();
      } else {
        await nativeSignOut();
        try {
          await getGoogleSignin().signOut();
        } catch (e) {}
      }
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    }
    await AsyncStorage.removeItem('livewave-access-token');
    await AsyncStorage.removeItem('livewave-refresh-token');
    setUser(null);
    setDemoLoggedIn(false);
    socketService.disconnect();
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      if (Platform.OS === 'web') {
        await auth.signOut();
      } else {
        await nativeSignOut();
        try {
          await getGoogleSignin().signOut();
        } catch (e) {}
      }
    } catch (error) {
      console.error('Failed to delete account', error);
      throw error;
    }
    await AsyncStorage.removeItem('livewave-access-token');
    await AsyncStorage.removeItem('livewave-refresh-token');
    setUser(null);
    setDemoLoggedIn(false);
    socketService.disconnect();
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      if (res.data) {
        useStreamStore.getState().setBalances({
          coins: res.data.coins ?? 0,
          diamonds: res.data.diamonds ?? 0,
        });
      }
      return res.data;
    } catch (e) {
      console.error('Failed to refresh profile', e);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      firebaseLogin,
      googleLogin,
      linkGoogle,
      completeProfile,
      updateProfile,
      uploadAvatar,
      logout,
      deleteAccount,
      refreshProfile,
    }),
    [user, isInitializing],
  );

  if (isInitializing) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context as AuthContextValue;
}
