import React, { useRef, useCallback } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle | Record<string, any>[];
  textStyle?: TextStyle | Record<string, any>[];
  icon?: React.ReactNode;
  loading?: boolean;
}

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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  let variantStyle: ViewStyle = {};
  let variantTextColor = '';

  const isDisabled = disabled || loading;

  switch (variant) {
    case 'primary':
      variantStyle = {
        backgroundColor: isDisabled ? accent + '60' : accent,
        shadowColor: accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.45 : 0.30,
        shadowRadius: 10,
        elevation: isDisabled ? 0 : 6,
      };
      variantTextColor = '#ffffff';
      break;
    case 'secondary':
      variantStyle = {
        backgroundColor: isDark ? colors.card : colors.bgSurface,
        borderWidth: 1,
        borderColor: colors.cardBorder,
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
      sizeTextTw = 'text-sm';
      borderRadiusTw = 'rounded-xl';
      break;
    case 'md':
      sizeContainerTw = 'h-14 px-6';
      sizeTextTw = 'text-base';
      break;
    case 'lg':
      sizeContainerTw = 'h-16 px-8';
      sizeTextTw = 'text-lg tracking-wider uppercase';
      break;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-center gap-2 ${borderRadiusTw} ${sizeContainerTw}`,
          variantStyle,
          isDisabled && { opacity: 0.55 },
          containerStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variantTextColor} />
        ) : (
          <>
            <Text
              style={[
                tw`font-bold ${sizeTextTw}`,
                { color: variantTextColor, letterSpacing: size === 'lg' ? 1.5 : 0 },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && icon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
