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
    md: 'p-4',
    lg: 'p-6',
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
      shadowColor: isDark ? accent : '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.20 : 0.08,
      shadowRadius: 12,
      elevation: 6,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: accent + '50',
      shadowColor: 'transparent',
    },
    filled: {
      backgroundColor: isDark ? colors.bgSurface : accent + '08',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: 'transparent',
    },
    glass: {
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(255,255,255,0.75)',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(255,255,255,0.90)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
  };

  return (
    <View
      style={[
        tw`rounded-2xl ${paddingMap[padding]}`,
        variantStyles[variant],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
