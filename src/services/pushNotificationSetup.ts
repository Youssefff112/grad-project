import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isRemotePushSupported } from './pushNotificationCapabilities';
import { registerExpoPushTokenApi } from './notification.service';

export { isRemotePushSupported } from './pushNotificationCapabilities';

let handlerConfigured = false;

async function ensureNotificationHandler() {
  if (handlerConfigured) return;
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigured = true;
}

/**
 * Request OS permission, resolve Expo push token, and register it with FitCore backend.
 * No-op on web and in Expo Go on Android (remote push requires a development build).
 */
export async function registerForPushAndSync(): Promise<string | null> {
  if (!isRemotePushSupported()) {
    if (__DEV__) {
      console.log(
        '[push] Skipped: remote push is not available in Expo Go on Android. ' +
          'Use `npx expo run:android` or an EAS development build to test push.',
      );
    }
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');
    await ensureNotificationHandler();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FitCore',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenRes =
      projectId && String(projectId).length > 4
        ? await Notifications.getExpoPushTokenAsync({ projectId: String(projectId) })
        : await Notifications.getExpoPushTokenAsync();
    const token = tokenRes.data;
    if (!token) return null;
    await registerExpoPushTokenApi(token);
    return token;
  } catch (e) {
    console.log('[push] registration skipped:', (e as Error)?.message || e);
    return null;
  }
}
