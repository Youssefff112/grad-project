import { Easing } from 'react-native';
import type {
  StackCardStyleInterpolator,
  StackNavigationOptions,
} from '@react-navigation/stack';

/** Fade duration — stack transitions (push, pop, left-edge swipe) */
export const STACK_TRANSITION_MS = 250;

const easeOut = Easing.out(Easing.cubic);

const timingSpec = {
  animation: 'timing' as const,
  config: {
    duration: STACK_TRANSITION_MS,
    easing: easeOut,
  },
};

/**
 * Pure cross-fade — used for buttons AND interactive horizontal back-swipe
 * (requires @react-navigation/stack, not native-stack).
 */
export const fadeCardInterpolator: StackCardStyleInterpolator = ({
  current: { progress },
}) => ({
  cardStyle: {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  },
});

export const stackScreenOptions: StackNavigationOptions = {
  cardStyleInterpolator: fadeCardInterpolator,
  transitionSpec: {
    open: timingSpec,
    close: timingSpec,
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  gestureVelocityImpact: 0.3,
  cardOverlayEnabled: false,
};
