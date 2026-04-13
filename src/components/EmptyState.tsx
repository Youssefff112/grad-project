import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  action,
}) => {
  const { isDark, accent } = useTheme();

  const iconColor = isDark ? accent : accent;
  const titleColor = isDark ? '#f1f5f9' : '#1e293b';
  const descColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={tw`flex-1 items-center justify-center px-6 py-12`}>
      {/* Icon */}
      <View style={tw`mb-6`}>
        <MaterialIcons name={icon as any} size={64} color={iconColor} />
      </View>

      {/* Title */}
      <Text
        style={[
          tw`text-2xl font-bold text-center mb-2`,
          { color: titleColor },
        ]}
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          style={[
            tw`text-base text-center mb-8 leading-relaxed`,
            { color: descColor },
          ]}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {action && (
        <Button
          title={action.label}
          size="md"
          onPress={action.onPress}
        />
      )}
    </View>
  );
};
