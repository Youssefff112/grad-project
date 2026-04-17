import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { CoachReviewCard } from '../components/CoachReviewCard';
import { TransformationCarousel } from '../components/TransformationCarousel';
import { CertificationBadge } from '../components/CertificationBadge';
import { RatingStarPicker } from '../components/RatingStarPicker';
import { ReviewSubmissionModal } from '../components/ReviewSubmissionModal';
import { getMockCoachById, getMockReviewsForCoach, MockReview } from '../data/mockCoaches';

export const CoachProfileDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route
}) => {
  const { isDark } = useTheme();
  const { coachId } = route.params;

  const coach = useMemo(() => getMockCoachById(coachId), [coachId]);
  const [reviews, setReviews] = useState<MockReview[]>(() => getMockReviewsForCoach(coachId));
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleSubmitReview = async (review: { rating: number; comment: string; isAnonymous: boolean }) => {
    // Add review locally (mock — not sent to API)
    const newReview: MockReview = {
      id: Date.now(),
      coachId,
      clientId: 999,
      rating: review.rating,
      comment: review.comment,
      isAnonymous: review.isAnonymous,
      authorName: review.isAnonymous ? '' : 'You',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReviews(prev => [newReview, ...prev]);
    setShowReviewModal(false);
    Alert.alert('Success', 'Review submitted successfully!');
  };

  if (!coach) {
    return (
      <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View style={tw`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        </View>
        <View style={tw`flex-1 items-center justify-center px-4`}>
          <MaterialIcons name="error-outline" size={48} color={isDark ? '#6b7280' : '#d1d5db'} />
          <Text style={tw`mt-4 text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Coach not found
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`mt-6 px-6 py-3 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
          >
            <Text style={tw`text-white font-semibold`}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Coach Profile
        </Text>
        <View style={tw`w-6`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pb-8`}>
        {/* Hero Section */}
        <View style={tw`mt-6 items-center mb-6`}>
          <View style={tw`w-24 h-24 rounded-full bg-gray-300 overflow-hidden mb-4`}>
            {coach.profilePicture ? (
              <Image source={{ uri: coach.profilePicture }} style={tw`w-full h-full`} />
            ) : (
              <View style={tw`w-full h-full items-center justify-center bg-gray-400`}>
                <MaterialIcons name="person" size={48} color="white" />
              </View>
            )}
          </View>

          <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {coach.name}
          </Text>

          {coach.specialties.length > 0 && (
            <View style={tw`flex-row flex-wrap justify-center gap-2 mt-2`}>
              {coach.specialties.map((specialty, idx) => (
                <View
                  key={idx}
                  style={tw`px-3 py-1 rounded-full ${isDark ? 'bg-blue-600 bg-opacity-30' : 'bg-orange-100'}`}
                >
                  <Text style={tw`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-orange-600'}`}>
                    {specialty}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Rating */}
          <View style={tw`mt-4 items-center`}>
            <RatingStarPicker
              rating={coach.rating}
              onRatingChange={() => {}}
              size={24}
              interactive={false}
            />
            <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Based on {coach.reviewStats.totalReviews} reviews
            </Text>
          </View>
        </View>

        {/* About Section */}
        {coach.bio && (
          <View style={tw`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text style={tw`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              About
            </Text>
            <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {coach.bio}
            </Text>
          </View>
        )}

        {/* Experience Section */}
        {coach.experienceYears > 0 && (
          <View style={tw`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text style={tw`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Experience
            </Text>
            <Text style={tw`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {coach.experienceYears} years of coaching experience
            </Text>
          </View>
        )}

        {/* Certifications Section */}
        {coach.certifications.length > 0 && (
          <View style={tw`mb-6`}>
            <Text style={tw`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
              Certifications
            </Text>
            {coach.certifications.map(cert => (
              <CertificationBadge
                key={cert.id}
                certification={cert}
                editable={false}
              />
            ))}
          </View>
        )}

        {/* Transformations Section */}
        {coach.transformations.length > 0 && (
          <View style={tw`mb-6`}>
            <Text style={tw`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
              Transformation Stories
            </Text>
            <TransformationCarousel
              transformations={coach.transformations}
              editable={false}
            />
          </View>
        )}

        {/* Reviews Section */}
        <View style={tw`mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Reviews ({reviews.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowReviewModal(true)}
              style={tw`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
            >
              <Text style={tw`text-xs text-white font-semibold`}>Write Review</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Distribution */}
          <View style={tw`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {[5, 4, 3, 2, 1].map(stars => (
              <View key={stars} style={tw`flex-row items-center mb-2`}>
                <Text style={tw`w-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {stars}★
                </Text>
                <View style={tw`flex-1 h-2 mx-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}>
                  <View
                    style={{
                      width: `${((coach.reviewStats.distribution[stars as keyof typeof coach.reviewStats.distribution] || 0) / (coach.reviewStats.totalReviews || 1)) * 100}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: isDark ? '#3b82f6' : '#ff6a00'
                    }}
                  />
                </View>
                <Text style={tw`w-6 text-right text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {coach.reviewStats.distribution[stars as keyof typeof coach.reviewStats.distribution] || 0}
                </Text>
              </View>
            ))}
          </View>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <>
              {reviews.map(review => (
                <CoachReviewCard key={review.id} review={review} />
              ))}
            </>
          ) : (
            <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
              No reviews yet
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <ReviewSubmissionModal
        visible={showReviewModal}
        coachName={coach.name}
        onSubmit={handleSubmitReview}
        onCancel={() => setShowReviewModal(false)}
      />
    </SafeAreaView>
  );
};
