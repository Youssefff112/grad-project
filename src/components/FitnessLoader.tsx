import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface FitnessLoaderProps {
  size?: number;
  color?: string;
}

export const FitnessLoader: React.FC<FitnessLoaderProps> = ({ size = 40, color }) => {
  const { accent } = useTheme();
  const themeColor = color || accent;

  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lift, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lift, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [lift]);

  // Simulate a bicep curl motion
  const translateY = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * 0.3],
  });

  const rotate = lift.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '10deg'],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
        <MaterialIcons name="fitness-center" size={size * 0.8} color={themeColor} />
      </Animated.View>
    </View>
  );
};
