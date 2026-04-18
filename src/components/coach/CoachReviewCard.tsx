import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { Review } from '../../services/coachService';

interface CoachReviewCardProps {
  review: Review;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const CoachReviewCard: React.FC<CoachReviewCardProps> = ({ review }) => {
  const { isDark, accent } = useTheme();

  return (
    <View style={[tw`rounded-xl p-4 mb-3`, { backgroundColor: isDark ? '#111128' : '#f8f7f5', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <View style={tw`flex-row items-center`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <MaterialIcons
              key={i}
              name={i < review.rating ? 'star' : 'star-outline'}
              size={14}
              color={i < review.rating ? accent : isDark ? '#475569' : '#cbd5e1'}
              style={tw`mr-0.5`}
            />
          ))}
          <Text style={[tw`ml-1.5 text-xs font-semibold`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {review.rating.toFixed(1)}
          </Text>
        </View>
        <Text style={[tw`text-xs`, { color: isDark ? '#475569' : '#94a3b8' }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>

      <Text style={[tw`text-sm font-semibold mb-1.5`, { color: isDark ? '#e2e8f0' : '#334155' }]}>
        {review.isAnonymous ? 'Anonymous Reviewer' : (review.authorName || 'Client Review')}
      </Text>

      {review.comment && (
        <Text numberOfLines={4} style={[tw`text-sm leading-5`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          {review.comment}
        </Text>
      )}
    </View>
  );
};
