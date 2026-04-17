import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { tw } from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import * as coachService from '../services/coachService';
import { CoachReviewCard } from '../components/CoachReviewCard';
import { TransformationCarousel } from '../components/TransformationCarousel';
import { CertificationBadge } from '../components/CertificationBadge';
import { RatingStarPicker } from '../components/RatingStarPicker';
import { ReviewSubmissionModal } from '../components/ReviewSubmissionModal';

export const CoachProfileDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route
}) => {
  const { isDark } = useTheme();
  const { userContext } = useUser();
  const { coachId } = route.params;

  const [coach, setCoach] = useState<coachService.CoachDetail | null>(null);
  const [reviews, setReviews] = useState<coachService.Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState<any>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  useEffect(() => {
    loadCoachDetail();
    loadReviews();
    if (userContext.userId) {
      checkReviewEligibility();
    }
  }, [coachId]);

  const loadCoachDetail = async () => {
    try {
      setError('');
      const response = await coachService.getCoachDetail(coachId);
      setCoach(response.coach);
    } catch (err: any) {
      setError(err.message || 'Failed to load coach profile');
      console.error('Error loading coach:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (page = 1) => {
    try {
      setReviewLoading(true);
      const response = await coachService.getCoachReviews(coachId, page, 10, 'newest');
      if (page === 1) {
        setReviews(response.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(response.reviews || [])]);
      }
      setHasMoreReviews((response.reviews?.length || 0) === 10);
      setReviewPage(page);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const response = await coachService.checkReviewEligibility(coachId);
      setReviewEligibility(response);
    } catch (err: any) {
      console.error('Error checking eligibility:', err);
      setReviewEligibility({ eligible: false });
    }
  };

  const handleAssignCoach = async () => {
    try {
      setAssigning(true);
      // Call UserContext method to set coach
      userContext.setCoach(coachId, coach?.bio || '');
      Alert.alert('Success', `Coach assigned successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign coach');
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmitReview = async (review: coachService.ReviewSubmission) => {
    try {
      await coachService.submitReview(coachId, review);
      setShowReviewModal(false);
      Alert.alert('Success', 'Review submitted successfully!');
      // Reload reviews
      loadReviews(1);
      checkReviewEligibility();
    } catch (err: any) {
      throw err;
    }
  };

  const handleLoadMoreReviews = () => {
    if (hasMoreReviews && !reviewLoading) {
      loadReviews(reviewPage + 1);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator
          size="large"
          color={isDark ? '#3b82f6' : '#ff6a00'}
        />
      </View>
    );
  }

  if (!coach) {
    return (
      <SafeAreaView style={tw`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View style={tw`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>
        </View>
        <View style={tw`flex-1 items-center justify-center px-4`}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={isDark ? '#6b7280' : '#d1d5db'}
          />
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
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#ffffff' : '#000000'}
          />
        </TouchableOpacity>
        <Text style={tw`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Coach Profile
        </Text>
        <View style={tw`w-6`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pb-8`}>
        {error && (
          <View style={tw`mt-4 p-3 rounded-lg bg-red-100 bg-opacity-50 flex-row items-center`}>
            <MaterialIcons name="error" size={16} color="#dc2626" />
            <Text style={tw`text-red-700 text-sm ml-2 flex-1`}>{error}</Text>
          </View>
        )}

        {/* Hero Section */}
        <View style={tw`mt-6 items-center mb-6`}>
          <View style={tw`w-24 h-24 rounded-full bg-gray-300 overflow-hidden mb-4`}>
            {coach.profilePicture ? (
              <Image
                source={{ uri: coach.profilePicture }}
                style={tw`w-full h-full`}
              />
            ) : (
              <View style={tw`w-full h-full items-center justify-center bg-gray-400`}>
                <MaterialIcons name="person" size={48} color="white" />
              </View>
            )}
          </View>

          <Text style={tw`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Coach #{coach.id}
          </Text>

          {coach.specialties && coach.specialties.length > 0 && (
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
              rating={coach.rating || 0}
              onRatingChange={() => {}}
              size={24}
              interactive={false}
            />
            <Text style={tw`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Based on {coach.reviewStats?.totalReviews || 0} reviews
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
        {coach.experienceYears && (
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
        {coach.certifications && coach.certifications.length > 0 && (
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
        {coach.transformations && coach.transformations.length > 0 && (
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
              Reviews ({coach.reviewStats?.totalReviews || 0})
            </Text>
            {reviewEligibility?.eligible && !reviewEligibility?.hasExistingReview && (
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                style={tw`px-3 py-1 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}
              >
                <Text style={tw`text-xs text-white font-semibold`}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Rating Distribution */}
          {coach.reviewStats && (
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
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <>
              {reviews.map(review => (
                <CoachReviewCard key={review.id} review={review} />
              ))}
              {hasMoreReviews && (
                <TouchableOpacity
                  onPress={handleLoadMoreReviews}
                  style={tw`py-3 items-center`}
                >
                  {reviewLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? '#3b82f6' : '#ff6a00'}
                    />
                  ) : (
                    <Text style={tw`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-orange-600'}`}>
                      Load more reviews
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={tw`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>
              No reviews yet
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Assign/Change Coach Button */}
      <View style={tw`px-4 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <TouchableOpacity
          onPress={handleAssignCoach}
          disabled={assigning}
          style={tw`py-4 px-6 rounded-lg ${
            isDark ? 'bg-blue-600' : 'bg-orange-500'
          } flex-row items-center justify-center`}
        >
          {assigning ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white font-bold text-lg`}>
                {userContext.coachId ? 'Change Coach' : 'Assign as Coach'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <ReviewSubmissionModal
        visible={showReviewModal}
        coachName={`Coach #${coach.id}`}
        onSubmit={handleSubmitReview}
        onCancel={() => setShowReviewModal(false)}
      />
    </SafeAreaView>
  );
};
