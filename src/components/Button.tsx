import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { FitnessLoader } from './FitnessLoader';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle | Record<string, any>[];
  textStyle?: TextStyle | Record<string, any>[];
  icon?: React.ReactNode;
  loading?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  containerStyle,
  textStyle,
  icon,
  loading = false,
  disabled,
  ...props
}) => {
  const { isDark, accent, colors } = useTheme();
  
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback((e: any) => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, friction: 5, tension: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.85, duration: 150, useNativeDriver: true }),
    ]).start();
    if (props.onPressIn) props.onPressIn(e);
  }, [scale, opacity, props]);

  const handlePressOut = useCallback((e: any) => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    if (props.onPressOut) props.onPressOut(e);
  }, [scale, opacity, props]);

  let variantStyle: ViewStyle = {};
  let variantTextColor = '';

  const isDisabled = disabled || loading;

  switch (variant) {
    case 'primary':
      variantStyle = {
        backgroundColor: isDisabled ? accent + '60' : accent,
        shadowColor: accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDisabled ? 0 : (isDark ? 0.35 : 0.25),
        shadowRadius: 12,
        elevation: isDisabled ? 0 : 8,
      };
      variantTextColor = '#ffffff';
      break;
    case 'secondary':
      variantStyle = {
        backgroundColor: isDark ? colors.card : colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.cardBorderStrong,
      };
      variantTextColor = colors.text;
      break;
    case 'outline':
      variantStyle = {
        borderWidth: 1.5,
        borderColor: isDisabled ? accent + '40' : accent + '90',
        backgroundColor: 'transparent',
      };
      variantTextColor = isDisabled ? accent + '60' : accent;
      break;
    case 'ghost':
      variantStyle = {
        backgroundColor: 'transparent',
      };
      variantTextColor = isDisabled ? colors.textMuted : accent;
      break;
  }

  let sizeContainerTw = '';
  let sizeTextTw = '';
  let borderRadiusTw = 'rounded-2xl';

  switch (size) {
    case 'sm':
      sizeContainerTw = 'h-10 px-4';
      sizeTextTw = 'text-sm font-bold';
      borderRadiusTw = 'rounded-xl';
      break;
    case 'md':
      sizeContainerTw = 'h-14 px-6';
      sizeTextTw = 'text-base font-bold';
      break;
    case 'lg':
      sizeContainerTw = 'h-16 px-8';
      sizeTextTw = 'text-lg font-black tracking-widest uppercase';
      break;
  }

  return (
    <AnimatedTouchableOpacity
      style={[
        tw`flex-row items-center justify-center gap-2 ${borderRadiusTw} ${sizeContainerTw}`,
        variantStyle,
        isDisabled && { opacity: 0.55 },
        containerStyle,
        { transform: [{ scale }], opacity },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <FitnessLoader size={size === 'sm' ? 24 : size === 'md' ? 32 : 40} color={variantTextColor} />
      ) : (
        <>
          <Text
            style={[
              tw`${sizeTextTw}`,
              { color: variantTextColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && icon}
        </>
      )}
    </AnimatedTouchableOpacity>
  );
};
