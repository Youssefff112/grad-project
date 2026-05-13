import React from 'react';
import { View, TouchableOpacity, Text, Image, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { Coach } from '../../services/coachService';
import { coachDisplayName } from '../../utils/coachDisplayName';
import { formatCoachRating } from '../../utils/coachRating';

export interface CoachCardProps {
  coach: Coach & { displayName?: string };
  onViewProfile: () => void;
  onChooseCoach?: () => void;
  canAssignCoach: boolean;
  isCurrentCoach: boolean;
  isChoosing: boolean;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  coach,
  onViewProfile,
  onChooseCoach,
  canAssignCoach,
  isCurrentCoach,
  isChoosing,
}) => {
  const { isDark, accent } = useTheme();

  const displayName = coach.displayName || coachDisplayName(coach);
  const cardBg = isDark ? '#12121f' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';

  const showChoose = canAssignCoach && !!onChooseCoach;

  return (
    <View
      style={[
        tw`rounded-2xl mb-4 overflow-hidden`,
        {
          backgroundColor: cardBg,
          borderWidth: isCurrentCoach ? 2 : 1,
          borderColor: isCurrentCoach ? accent + '99' : borderColor,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 12,
            },
            android: { elevation: 3 },
          }),
        },
      ]}
    >
      {isCurrentCoach && (
        <View
          style={[
            tw`flex-row items-center justify-center py-2 px-3`,
            { backgroundColor: accent + '18' },
          ]}
        >
          <MaterialIcons name="verified" size={16} color={accent} />
          <Text style={[tw`ml-1.5 text-xs font-bold`, { color: accent }]}>Your coach</Text>
        </View>
      )}

      <View style={tw`p-4`}>
        <View style={tw`flex-row items-start`}>
          <View
            style={[
              tw`w-16 h-16 rounded-2xl mr-4 overflow-hidden items-center justify-center`,
              { backgroundColor: accent + '1a' },
            ]}
          >
            {coach.profilePicture ? (
              <Image source={{ uri: coach.profilePicture }} style={tw`w-full h-full`} />
            ) : (
              <MaterialIcons name="person" size={32} color={accent} />
            )}
          </View>

          <View style={tw`flex-1`}>
            <Text style={[tw`text-lg font-bold`, { color: titleColor }]} numberOfLines={1}>
              {displayName}
            </Text>
            {coach.specialties && coach.specialties.length > 0 && (
              <Text style={[tw`text-xs mt-1 leading-4`, { color: muted }]} numberOfLines={2}>
                {coach.specialties.slice(0, 3).join(' · ')}
              </Text>
            )}
            <View style={tw`flex-row items-center mt-2`}>
              <MaterialIcons name="star" size={16} color={accent} />
              <Text style={[tw`text-sm font-bold ml-1`, { color: titleColor }]}>
                {formatCoachRating(coach.rating)}
              </Text>
              <Text style={[tw`text-xs ml-1`, { color: muted }]}>
                ({coach.ratingCount ?? 0} reviews)
              </Text>
              {!!coach.experienceYears && (
                <Text style={[tw`text-xs ml-2`, { color: muted }]}>· {coach.experienceYears} yrs</Text>
              )}
            </View>
          </View>
        </View>

        {coach.bio ? (
          <Text
            numberOfLines={2}
            style={[tw`text-sm mt-3 leading-5`, { color: muted }]}
          >
            {coach.bio}
          </Text>
        ) : null}

        <View style={tw`flex-row mt-4 gap-2`}>
          <TouchableOpacity
            onPress={onViewProfile}
            activeOpacity={0.85}
            style={[
              showChoose ? tw`flex-1` : tw`w-full`,
              tw`flex-row items-center justify-center py-3 rounded-xl`,
              {
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              },
            ]}
          >
            <MaterialIcons name="visibility" size={18} color={accent} />
            <Text style={[tw`ml-2 text-sm font-bold`, { color: titleColor }]}>Profile</Text>
          </TouchableOpacity>

          {showChoose ? (
            <TouchableOpacity
              onPress={onChooseCoach}
              disabled={isCurrentCoach || isChoosing}
              activeOpacity={0.85}
              style={[
                tw`flex-1 flex-row items-center justify-center py-3 rounded-xl`,
                {
                  backgroundColor: isCurrentCoach ? (isDark ? '#1e293b' : '#e2e8f0') : accent,
                  opacity: isCurrentCoach ? 0.85 : 1,
                },
              ]}
            >
              {isChoosing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons
                    name={isCurrentCoach ? 'check-circle' : 'how-to-reg'}
                    size={18}
                    color={isCurrentCoach ? accent : '#fff'}
                  />
                  <Text
                    style={[
                      tw`ml-2 text-sm font-bold`,
                      { color: isCurrentCoach ? accent : '#fff' },
                    ]}
                  >
                    {isCurrentCoach ? 'Assigned' : 'Choose'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};
