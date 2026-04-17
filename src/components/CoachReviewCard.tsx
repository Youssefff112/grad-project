import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tw } from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Review } from '../services/coachService';

interface CoachReviewCardProps {
  review: Review;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const CoachReviewCard: React.FC<CoachReviewCardProps> = ({ review }) => {
  const { isDark } = useTheme();
  const starColor = isDark ? '#3b82f6' : '#ff6a00';

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <MaterialIcons
        key={i}
        name={i < review.rating ? 'star' : 'star-outline'}
        size={14}
        color={i < review.rating ? starColor : isDark ? '#64748b' : '#cbd5e1'}
        style={tw`mr-0.5`}
      />
    ));
  };

  return (
    <View
      style={tw`rounded-xl p-4 mb-3 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} border ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <View style={tw`flex-row items-center`}>
          {renderStars()}
          <Text style={tw`ml-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {review.rating.toFixed(1)}
          </Text>
        </View>
        <Text style={tw`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {formatDate(review.createdAt)}
        </Text>
      </View>

      {/* Author */}
      <Text style={tw`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
        {review.isAnonymous ? 'Anonymous Reviewer' : (review.authorName || 'Client Review')}
      </Text>

      {/* Comment */}
      {review.comment && (
        <Text
          style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          numberOfLines={4}
        >
          {review.comment}
        </Text>
      )}
    </View>
  );
};
