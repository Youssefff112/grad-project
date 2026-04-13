import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryAction?: {
    label?: string;
    onPress: () => void;
  };
  dismissAction?: {
    label?: string;
    onPress: () => void;
  };
  showIcon?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retryAction,
  dismissAction,
  showIcon = true,
}) => {
  const { isDark, accent } = useTheme();

  const titleColor = isDark ? '#f1f5f9' : '#1e293b';
  const messageColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={tw`flex-1 items-center justify-center px-6 py-12`}>
      {/* Error Icon */}
      {showIcon && (
        <View style={tw`mb-6`}>
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        </View>
      )}

      {/* Title */}
      <Text
        style={[
          tw`text-2xl font-bold text-center mb-2`,
          { color: titleColor },
        ]}
      >
        {title}
      </Text>

      {/* Error Message */}
      <Text
        style={[
          tw`text-base text-center mb-8 leading-relaxed`,
          { color: messageColor },
        ]}
      >
        {message}
      </Text>

      {/* Actions */}
      <View style={tw`flex-row gap-3 w-full`}>
        {dismissAction && (
          <TouchableOpacity
            onPress={dismissAction.onPress}
            style={tw`flex-1`}
          >
            <Button
              title={dismissAction.label || 'Dismiss'}
              variant="secondary"
              size="md"
            />
          </TouchableOpacity>
        )}
        {retryAction && (
          <TouchableOpacity
            onPress={retryAction.onPress}
            style={tw`flex-1`}
          >
            <Button
              title={retryAction.label || 'Retry'}
              size="md"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
