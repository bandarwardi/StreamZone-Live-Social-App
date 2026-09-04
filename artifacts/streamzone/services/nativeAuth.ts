import { initializeApp, getApps } from '@react-native-firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInWithPhoneNumber, signOut as firebaseSignOut, linkWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseConfig } from './firebase';

if (getApps().length === 0) {
  initializeApp({
    ...firebaseConfig,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string,
  } as any);
}

export const getNativeAuth = () => getAuth();
export const getGoogleSignin = () => GoogleSignin;
export const nativeGoogleCredential = (idToken: string) => GoogleAuthProvider.credential(idToken);
export const nativeSignInWithCredential = (credential: any) => signInWithCredential(getAuth(), credential);
export const nativeLinkWithCredential = (credential: any) => linkWithCredential(getAuth().currentUser!, credential);
export const nativeSignInWithPhoneNumber = (phone: string) => signInWithPhoneNumber(getAuth(), phone);
export const nativeSignOut = async () => {
  try {
    await firebaseSignOut(getAuth());
  } catch (e: any) {
    if (e.code !== 'auth/no-current-user') throw e;
  }
};
