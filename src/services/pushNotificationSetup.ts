import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerExpoPushTokenApi } from './notification.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request OS permission, resolve Expo push token, and register it with FitCore backend.
 * No-op on web. Safe to call on every login.
 */
export async function registerForPushAndSync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
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
