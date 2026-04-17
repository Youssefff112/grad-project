import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Coach } from '../services/coachService';

interface CoachCardProps {
  coach: Coach;
  onPress: () => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, onPress }) => {
  const { isDark } = useTheme();
  const starColor = isDark ? '#3b82f6' : '#ff6a00';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={tw`rounded-2xl p-4 mb-4 ${isDark ? 'bg-gray-900' : 'bg-white'} shadow`}
    >
      <View style={tw`flex-row items-start mb-3`}>
        {/* Profile Picture */}
        <View style={tw`w-16 h-16 rounded-full bg-gray-300 mr-3 overflow-hidden`}>
          {coach.profilePicture ? (
            <Image
              source={{ uri: coach.profilePicture }}
              style={tw`w-full h-full`}
            />
          ) : (
            <View style={tw`w-full h-full items-center justify-center bg-gray-400`}>
              <MaterialIcons name="person" size={32} color="white" />
            </View>
          )}
        </View>

        {/* Coach Info */}
        <View style={tw`flex-1 justify-center`}>
          <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {coach.userId}
          </Text>

          {coach.specialties && coach.specialties.length > 0 && (
            <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {coach.specialties.slice(0, 2).join(', ')}
            </Text>
          )}

          {/* Rating */}
          <View style={tw`flex-row items-center mt-2`}>
            <MaterialIcons name="star" size={16} color={starColor} />
            <Text style={tw`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} ml-1`}>
              {coach.rating?.toFixed(1) || '0.0'} ({coach.ratingCount || 0} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Bio Preview */}
      {coach.bio && (
        <Text
          numberOfLines={2}
          style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}
        >
          {coach.bio}
        </Text>
      )}

      {/* View Profile Button */}
      <TouchableOpacity
        onPress={onPress}
        style={tw`py-2 px-4 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
      >
        <Text style={tw`text-center text-white font-semibold`}>View Profile</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
