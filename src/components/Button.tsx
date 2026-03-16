import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import tw from '../tw';

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
  const baseContainerTw = `flex-row items-center justify-center rounded-xl active:scale-95 transition-all`;

  let variantContainerTw = '';
  let variantTextTw = '';

  switch (variant) {
    case 'primary':
      variantContainerTw = 'bg-primary shadow-lg shadow-primary/30';
      variantTextTw = 'text-white font-bold';
      break;
    case 'secondary':
      variantContainerTw = 'bg-slate-100 dark:bg-slate-800';
      variantTextTw = 'text-slate-900 dark:text-white font-bold';
      break;
    case 'outline':
      variantContainerTw = 'border border-primary/50 bg-transparent';
      variantTextTw = 'text-primary font-bold';
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
      style={[tw`${baseContainerTw} ${variantContainerTw} ${sizeContainerTw}`, containerStyle]}
      {...props}
    >
      <Text style={[tw`${variantTextTw} ${sizeTextTw}`, textStyle]}>
        {title}
      </Text>
      {icon && icon}
    </TouchableOpacity>
  );
};
