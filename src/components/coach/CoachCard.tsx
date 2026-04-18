import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { Coach } from '../../services/coachService';

interface CoachCardProps {
  coach: Coach & { displayName?: string };
  onPress: () => void;
}

export const CoachCard: React.FC<CoachCardProps> = ({ coach, onPress }) => {
  const { isDark, accent } = useTheme();

  const displayName = coach.displayName || `Coach #${coach.userId}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[tw`rounded-2xl p-4 mb-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
    >
      <View style={tw`flex-row items-start mb-3`}>
        <View style={[tw`w-14 h-14 rounded-full mr-3 overflow-hidden items-center justify-center`, { backgroundColor: accent + '20' }]}>
          {coach.profilePicture ? (
            <Image source={{ uri: coach.profilePicture }} style={tw`w-full h-full`} />
          ) : (
            <MaterialIcons name="person" size={28} color={accent} />
          )}
        </View>

        <View style={tw`flex-1 justify-center`}>
          <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            {displayName}
          </Text>

          {coach.specialties && coach.specialties.length > 0 && (
            <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {coach.specialties.slice(0, 2).join(' · ')}
            </Text>
          )}

          <View style={tw`flex-row items-center mt-1`}>
            <MaterialIcons name="star" size={14} color={accent} />
            <Text style={[tw`text-xs font-semibold ml-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {coach.rating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[tw`text-xs ml-1`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              ({coach.ratingCount || 0} reviews)
            </Text>
            {coach.experienceYears ? (
              <Text style={[tw`text-xs ml-2`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                · {coach.experienceYears}y exp
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {coach.bio && (
        <Text numberOfLines={2} style={[tw`text-sm mb-3 leading-5`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {coach.bio}
        </Text>
      )}

      <View style={[tw`py-2.5 px-4 rounded-xl items-center`, { backgroundColor: accent }]}>
        <Text style={tw`text-sm text-white font-bold`}>View Profile</Text>
      </View>
    </TouchableOpacity>
  );
};
