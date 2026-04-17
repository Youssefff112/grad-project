import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tw } from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Certification } from '../services/coachService';

interface CertificationBadgeProps {
  certification: Certification;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  certification,
  onDelete,
  editable = false
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={tw`flex-row items-center p-3 rounded-lg mb-2 ${
        isDark ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'
      } border ${isDark ? 'border-blue-700' : 'border-blue-200'}`}
    >
      <MaterialIcons
        name="verified"
        size={20}
        color={isDark ? '#3b82f6' : '#0284c7'}
        style={tw`mr-2`}
      />

      <View style={tw`flex-1`}>
        <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {certification.name}
        </Text>
        <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-0.5`}>
          {certification.issuer} • {certification.year}
        </Text>
      </View>

      {editable && onDelete && (
        <TouchableOpacity onPress={() => onDelete(certification.id)} style={tw`ml-2`}>
          <MaterialIcons
            name="close"
            size={20}
            color={isDark ? '#ef4444' : '#dc2626'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
