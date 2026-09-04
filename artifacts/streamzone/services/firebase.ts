import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore: False positive TS error in Firebase SDK, getReactNativePersistence is exported at runtime
import { initializeAuth, getReactNativePersistence, Auth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://' + process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID + '.firebaseio.com',
};

let authInstance: Auth | any = null;

if (firebaseConfig.apiKey) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  if (Platform.OS === 'web') {
    // getAuth automatically includes dependencies for web (like browserPopupRedirectResolver) needed for signInWithPopup
    authInstance = getAuth(app);
  } else {
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } catch (e: any) {
      if (e.code === 'auth/already-initialized') {
        authInstance = getAuth(app);
      } else {
        throw e;
      }
    }
  }
} else {
  console.warn('Firebase API Key is missing. Firebase Auth will not be initialized.');
  // Provide a dummy object to prevent crashes when imported
  authInstance = {} as any;
}

export const auth = authInstance as Auth;
