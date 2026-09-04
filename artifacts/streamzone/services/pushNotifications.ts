import { Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

export async function requestUserPermission() {
  if (Platform.OS === 'web') return false;

  try {
    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function getFCMToken() {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestUserPermission();
    if (hasPermission) {
      const messaging = getMessaging();
      const token = await getToken(messaging);
      return token;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
}

