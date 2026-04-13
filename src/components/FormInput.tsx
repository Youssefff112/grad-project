import React, { useState } from 'react';
import {
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
  ...props
}) => {
  const { isDark, accent } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const inputBg = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = error ? '#ef4444' : isDark ? 'rgba(255,255,255,0.1)' : accent + '18';
  const inputText = isDark ? '#ffffff' : '#1e293b';
  const labelColor = isDark ? '#e2e8f0' : '#1e293b';
  const helperColor = error ? '#ef4444' : isDark ? '#94a3b8' : '#64748b';

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
          {required && <Text style={{ color: '#ef4444' }}>*</Text>}
        </View>
      )}

      <View style={tw`relative`}>
        <TextInput
          style={[
            tw`w-full h-14 rounded-xl px-4 pr-12 text-lg`,
            {
              backgroundColor: disabled ? (isDark ? '#0a0a12' : '#f5f5f5') : inputBg,
              borderWidth: 2,
              borderColor: inputBorder,
              color: inputText,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />

        {/* Right Icon (password toggle or custom icon) */}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={tw`absolute right-4 top-4`}
            disabled={disabled}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color="#94a3b8"
            />
          </TouchableOpacity>
        ) : icon ? (
          <View style={tw`absolute right-4 top-4`}>
            {icon}
          </View>
        ) : null}
      </View>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <View style={tw`flex-row items-center gap-1 px-1`}>
          {error && (
            <MaterialIcons name="error" size={14} color="#ef4444" />
          )}
          <Text style={[tw`text-xs font-medium`, { color: helperColor }]}>
            {error ? (helperText || 'Error') : helperText}
          </Text>
        </View>
      )}
    </View>
  );
};
