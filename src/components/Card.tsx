import React from 'react';
import { View, ViewProps } from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}) => {
  const { isDark, accent, colors } = useTheme();

  const paddingMap = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: 'transparent',
    },
    elevated: {
      backgroundColor: isDark ? colors.bgSurface : '#ffffff',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.cardBorder : 'transparent',
      shadowColor: isDark ? 'transparent' : '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: isDark ? 0 : 8,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: accent + '40',
      shadowColor: 'transparent',
    },
    filled: {
      backgroundColor: isDark ? '#1a1a1f' : accent + '08',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: 'transparent',
    },
    glass: {
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.03)'
        : 'rgba(255,255,255,0.85)',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.60)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.04,
      shadowRadius: 16,
      elevation: 4,
    },
  };

  return (
    <View
      style={[
        tw`rounded-3xl ${paddingMap[padding]}`,
        variantStyles[variant],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
