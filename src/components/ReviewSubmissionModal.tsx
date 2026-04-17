import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tw } from '../tw';
import { useTheme } from '../context/ThemeContext';
import { RatingStarPicker } from './RatingStarPicker';

interface ReviewSubmissionModalProps {
  visible: boolean;
  coachName?: string;
  onSubmit: (review: { rating: number; comment: string; isAnonymous: boolean }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  visible,
  coachName,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { isDark } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.length > 500) {
      setError('Comment cannot exceed 500 characters');
      return;
    }

    try {
      setError('');
      await onSubmit({ rating, comment, isAnonymous });
      // Reset form
      setRating(5);
      setComment('');
      setIsAnonymous(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    }
  };

  const handleCancel = () => {
    setRating(5);
    setComment('');
    setIsAnonymous(false);
    setError('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View
          style={tw`w-11/12 rounded-2xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        >
          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Leave a Review
            </Text>
            <TouchableOpacity onPress={handleCancel} disabled={loading}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          {coachName && (
            <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Coach: {coachName}
            </Text>
          )}

          {/* Rating */}
          <View style={tw`mb-6`}>
            <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
              Rating
            </Text>
            <RatingStarPicker
              rating={rating}
              onRatingChange={setRating}
              size={32}
              interactive={!loading}
            />
          </View>

          {/* Comment */}
          <View style={tw`mb-6`}>
            <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Comment (Optional)
            </Text>
            <TextInput
              style={tw`p-3 rounded-lg ${
                isDark
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-gray-100 text-gray-900 border-gray-300'
              } border h-32 text-base`}
              placeholder="Share your experience with this coach..."
              placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
              multiline
              maxLength={500}
              value={comment}
              onChangeText={setComment}
              editable={!loading}
            />
            <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 text-right`}>
              {comment.length}/500
            </Text>
          </View>

          {/* Anonymous Toggle */}
          <View style={tw`flex-row items-center justify-between mb-6 p-3 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <View>
              <Text style={tw`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Post Anonymously
              </Text>
              <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Hide your name from other users
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              disabled={loading}
              trackColor={{
                false: isDark ? '#4b5563' : '#cbd5e1',
                true: isDark ? '#3b82f6' : '#ff6a00'
              }}
            />
          </View>

          {/* Error */}
          {error && (
            <View style={tw`p-3 rounded-lg bg-red-100 bg-opacity-50 mb-4 flex-row items-center`}>
              <MaterialIcons name="error" size={16} color="#dc2626" />
              <Text style={tw`text-red-700 text-sm ml-2`}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={loading}
              style={tw`flex-1 py-3 px-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'
              }`}
            >
              <Text style={tw`text-center font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={tw`flex-1 py-3 px-4 rounded-lg ${
                isDark ? 'bg-blue-600' : 'bg-orange-500'
              } flex-row items-center justify-center`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-center font-semibold text-white`}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
