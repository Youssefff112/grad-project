import React from 'react';
import { View, ViewProps } from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}) => {
  const { isDark, accent } = useTheme();

  const paddingMap = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantStyles = {
    default: {
      backgroundColor: isDark ? '#111128' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      shadowColor: 'transparent',
    },
    elevated: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderWidth: 0,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: accent + '40',
    },
    filled: {
      backgroundColor: isDark ? '#1e293b' : accent + '08',
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };

  const selectedVariant = variantStyles[variant];

  return (
    <View
      style={[
        tw`rounded-xl ${paddingMap[padding]}`,
        selectedVariant,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
