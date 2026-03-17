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
  const baseContainerTw = `flex-row items-center justify-center rounded-xl active:scale-95 transition-all`;

  let variantStyle: ViewStyle = {};
  let variantTextTw = '';

  switch (variant) {
    case 'primary':
      variantStyle = { backgroundColor: accent, shadowColor: accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 };
      variantTextTw = 'text-white font-bold';
      break;
    case 'secondary':
      variantTextTw = 'text-slate-900 dark:text-white font-bold';
      break;
    case 'outline':
      variantStyle = { borderWidth: 1, borderColor: accent + '80', backgroundColor: 'transparent' };
      variantTextTw = 'font-bold';
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
      style={[
        tw`${baseContainerTw} ${variant === 'secondary' ? 'bg-slate-100 dark:bg-slate-800' : ''} ${sizeContainerTw}`,
        variantStyle,
        containerStyle,
      ]}
      {...props}
    >
      <Text style={[tw`${variantTextTw} ${sizeTextTw}`, variant === 'outline' && { color: accent }, textStyle]}>
        {title}
      </Text>
      {icon && icon}
    </TouchableOpacity>
  );
};
