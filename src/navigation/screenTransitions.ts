import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Shared stack transition — used for every screen in App.tsx */
export const STACK_TRANSITION_MS = Platform.select({
  ios: 340,
  android: 300,
  default: 320,
}) as number;

/**
 * Subtle fade + slight vertical drift reads smoother than a flat opacity cut.
 * Direction-neutral on tab switches; still feels natural on push/pop.
 */
export const stackScreenOptions: NativeStackNavigationOptions = {
  animation: 'fade_from_bottom',
  animationDuration: STACK_TRANSITION_MS,
  gestureEnabled: true,
  // iOS: edge-swipe and full-screen dismiss follow fade_from_bottom, not simple_push
  animationMatchesGesture: Platform.OS === 'ios',
  fullScreenGestureEnabled: Platform.OS === 'ios',
  freezeOnBlur: true,
};
