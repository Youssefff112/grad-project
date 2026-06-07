import { Easing, Platform } from 'react-native';
import {
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';

/** Cross-fade transition for the entire app */
export const stackScreenOptions: StackNavigationOptions = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
  transitionSpec: {
    open: {
      animation: 'timing',
      config: { duration: 250, easing: Easing.out(Easing.poly(4)) },
    },
    close: {
      animation: 'timing',
      config: { duration: 250, easing: Easing.in(Easing.poly(4)) },
    },
  },
  gestureEnabled: false,
  cardOverlayEnabled: true,
  headerMode: 'screen',
  presentation: 'card',
};

/** Modal style sliding up from bottom */
export const modalScreenOptions: StackNavigationOptions = {
  ...TransitionPresets.ModalPresentationIOS,
  gestureEnabled: true,
  gestureDirection: 'vertical',
  presentation: 'modal',
};

/** Fast cross-fade for specific tabs or deep-links */
export const fadeScreenOptions: StackNavigationOptions = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: {
      opacity: current.progress,
    },
  }),
  gestureEnabled: false,
};

