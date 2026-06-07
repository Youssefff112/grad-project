import React from 'react';
import { Switch as RNSwitch, SwitchProps, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const OFF_TRACK = { dark: '#334155', light: '#cbd5e1' } as const;

export const Switch = (props: SwitchProps) => {
  const { isDark, accent } = useTheme();
  const offColor = isDark ? OFF_TRACK.dark : OFF_TRACK.light;

  return (
    <RNSwitch
      trackColor={{ true: accent, false: offColor }}
      thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
      ios_backgroundColor={offColor}
      {...props}
    />
  );
};
