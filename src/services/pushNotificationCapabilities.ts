import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Remote push (Expo push token) is not available in Expo Go on Android (SDK 53+).
 * Use a development build (`npx expo run:android`) or EAS build to test push.
 * In-app unread badges still work via WebSocket in NotificationContext.
 */
export function isRemotePushSupported(): boolean {
  if (Platform.OS === 'web') return false;
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (inExpoGo && Platform.OS === 'android') return false;
  return true;
}
