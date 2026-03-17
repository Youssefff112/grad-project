import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle | Record<string, any>[];
  textStyle?: TextStyle | Record<string, any>[];
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  containerStyle,
  textStyle,
  icon,
  ...props
}) => {
  const { isDark, accent } = useTheme();
  const baseContainerTw = `flex-row items-center justify-center rounded-xl`;

  let variantStyle: ViewStyle = {};
  let variantTextColor = '';

  switch (variant) {
    case 'primary':
      variantStyle = { backgroundColor: accent, shadowColor: accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 };
      variantTextColor = '#ffffff';
      break;
    case 'secondary':
      variantStyle = { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' };
      variantTextColor = isDark ? '#ffffff' : '#1e293b';
      break;
    case 'outline':
      variantStyle = { borderWidth: 1, borderColor: accent + '80', backgroundColor: 'transparent' };
      variantTextColor = accent;
      break;
  }

  let sizeContainerTw = '';
  let sizeTextTw = '';

  switch (size) {
    case 'sm':
      sizeContainerTw = 'h-10 px-4';
      sizeTextTw = 'text-sm';
      break;
    case 'md':
      sizeContainerTw = 'h-14 px-6';
      sizeTextTw = 'text-base';
      break;
    case 'lg':
      sizeContainerTw = 'h-16 px-8';
      sizeTextTw = 'text-lg tracking-widest uppercase';
      break;
  }

  return (
    <TouchableOpacity
      style={[tw`${baseContainerTw} ${sizeContainerTw}`, variantStyle, containerStyle]}
      {...props}
    >
      <Text style={[tw`font-bold ${sizeTextTw}`, { color: variantTextColor }, textStyle]}>
        {title}
      </Text>
      {icon && icon}
    </TouchableOpacity>
  );
};
