import React, { useState, useRef, useCallback } from 'react';
import {
  Animated,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface FormInputProps extends Omit<TextInputProps, 'editable'> {
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
  disabled?: boolean;
  onIconPress?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  error,
  helperText,
  icon,
  isPassword = false,
  required = false,
  disabled = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  onIconPress,
  ...props
}) => {
  const { isDark, accent, colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  // Animated border glow on focus
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(
    (e: any) => {
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: false,
      }).start();
      onFocus?.(e);
    },
    [focusAnim, onFocus],
  );

  const handleBlur = useCallback(
    (e: any) => {
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: false,
      }).start();
      onBlur?.(e);
    },
    [focusAnim, onBlur],
  );

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : colors.inputBorder,
      error ? colors.error : accent + '90',
    ],
  });

  const animatedBorderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 2],
  });

  const labelColor = isDark ? colors.textSecondary : colors.text;
  const helperColor = error ? colors.error : colors.textMuted;
  const inputText = colors.text;

  return (
    <View style={tw`flex-col gap-2`}>
      {label && (
        <View style={tw`flex-row items-center gap-1`}>
          <Text
            style={[
              tw`text-sm font-bold uppercase tracking-wider`,
              { color: labelColor },
            ]}
          >
            {label}
          </Text>
          {required && <Text style={{ color: colors.error }}>*</Text>}
        </View>
      )}

      <Animated.View
        style={[
          tw`relative w-full rounded-2xl overflow-hidden`,
          {
            borderWidth: animatedBorderWidth,
            borderColor: animatedBorderColor,
            backgroundColor: disabled
              ? isDark ? colors.bg : '#f5f5f5'
              : colors.inputBg,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <TextInput
          style={[
            tw`w-full h-14 px-4 pr-12 text-base`,
            { color: inputText },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={tw`absolute right-4 top-4`}
            disabled={disabled}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : icon ? (
          <View style={tw`absolute right-4 top-4`}>
            {onIconPress ? (
              <TouchableOpacity onPress={onIconPress} disabled={disabled}>
                {icon}
              </TouchableOpacity>
            ) : (
              icon
            )}
          </View>
        ) : null}
      </Animated.View>

      {(error || helperText) && (
        <View style={tw`flex-row items-center gap-1 px-1`}>
          {error && (
            <MaterialIcons name="error" size={14} color={colors.error} />
          )}
          <Text style={[tw`text-xs font-medium`, { color: helperColor }]}>
            {error ? helperText || 'Error' : helperText}
          </Text>
        </View>
      )}
    </View>
  );
};
