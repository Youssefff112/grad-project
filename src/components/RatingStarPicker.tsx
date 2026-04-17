import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';

interface RatingStarPickerProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  interactive?: boolean;
}

export const RatingStarPicker: React.FC<RatingStarPickerProps> = ({
  rating,
  onRatingChange,
  size = 32,
  interactive = true
}) => {
  const { isDark } = useTheme();
  const starColor = isDark ? '#3b82f6' : '#ff6a00';

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= rating;
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && onRatingChange(i)}
          style={tw`mr-1`}
        >
          <MaterialIcons
            name={isFilled ? 'star' : 'star-outline'}
            size={size}
            color={isFilled ? starColor : isDark ? '#64748b' : '#cbd5e1'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={tw`flex-row items-center`}>
      <View style={tw`flex-row`}>
        {renderStars()}
      </View>
      {interactive && (
        <Text style={tw`ml-3 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};
