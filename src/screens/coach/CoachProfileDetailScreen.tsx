import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { CoachReviewCard } from '../../components/coach/CoachReviewCard';
import { TransformationCarousel } from '../../components/TransformationCarousel';
import { CertificationBadge } from '../../components/CertificationBadge';
import { RatingStarPicker } from '../../components/RatingStarPicker';
import { ReviewSubmissionModal } from '../../components/ReviewSubmissionModal';
import * as coachService from '../../services/coachService';
import * as clientService from '../../services/clientService';
import { buildImageUrl } from '../../utils/imageUrl';
import type { CoachDetail, Review } from '../../services/coachService';
import { canClientSelectPersonalCoach } from '../../utils/planUtils';
import { coachDisplayName } from '../../utils/coachDisplayName';
import { formatCoachRating, numericCoachRating } from '../../utils/coachRating';

type CoachWithDisplay = CoachDetail & { displayName: string };

export const CoachProfileDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { isDark, accent } = useTheme();
  const insets = useSafeAreaInsets();
  const { coachId, coachName: routeCoachName } = route?.params ?? {};
  const { subscriptionPlan, coachId: myCoachId, setCoach } = useUser();

  const [coach, setCoachState] = useState<CoachWithDisplay | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    if (!coachId) {
      setError('No coach ID provided.');
      setLoading(false);
      return;
    }
    loadCoachData();
  }, [coachId]);

  const loadCoachData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coachRes, reviewsRes] = await Promise.all([
        coachService.getCoachDetail(coachId),
        coachService.getCoachReviews(coachId),
      ]);

      const coachData = coachRes.coach as CoachDetail;
      const displayName = coachDisplayName(coachData) || routeCoachName || 'Coach';
      setCoachState({ ...coachData, displayName });
      setReviews(reviewsRes.reviews);
    } catch (err: any) {
      setError(err?.message || 'Failed to load coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (review: { rating: number; comment: string; isAnonymous: boolean }) => {
    try {
      const { review: newReview } = await coachService.submitReview(coachId, {
        rating: review.rating,
        comment: review.comment,
        isAnonymous: review.isAnonymous,
      });
      setReviews(prev => [newReview, ...prev]);
      setShowReviewModal(false);
      Alert.alert('Success', 'Review submitted!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not submit review. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <View style={[tw`flex-row items-center px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
          </TouchableOpacity>
        </View>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={[tw`mt-3 text-sm`, { color: subtextColor }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !coach) {
    return (
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <View style={[tw`flex-row items-center px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
          </TouchableOpacity>
        </View>
        <View style={tw`flex-1 items-center justify-center px-4`}>
          <MaterialIcons name="error-outline" size={52} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text style={[tw`mt-4 text-lg font-bold`, { color: isDark ? '#475569' : '#94a3b8' }]}>
            {error || 'Coach not found'}
          </Text>
          <TouchableOpacity onPress={loadCoachData} style={[tw`mt-4 px-6 py-3 rounded-xl`, { backgroundColor: accent }]}>
            <Text style={tw`text-white font-bold`}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[tw`mt-3 px-6 py-3 rounded-xl`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <Text style={[tw`font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const reviewStats = coach.reviewStats;
  const totalReviews = reviewStats?.totalReviews ?? reviews.length;
  const averageRating = numericCoachRating(reviewStats?.averageRating ?? coach.rating ?? 0);
  const distribution = reviewStats?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  const coachUserId = coach.userId;
  const isMyCoach = !!(myCoachId && coachUserId && String(myCoachId) === String(coachUserId));
  const showCoachActions = canClientSelectPersonalCoach(subscriptionPlan) && !!coachUserId;

  const handleMessageCoach = () => {
    if (!coachUserId) return;
    navigation.navigate('Chat', {
      conversationName: coach.displayName,
      receiverId: coachUserId,
      conversationId: null,
    });
  };

  const handleAssignThisCoach = () => {
    if (!coachUserId) return;
    Alert.alert(
      'Assign this coach?',
      `${coach.displayName} will be able to view your progress and manage your workout and meal plans.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            setAssigning(true);
            try {
              await clientService.selectCoach(coachUserId);
              setCoach(String(coachUserId), coach.displayName);
              Alert.alert('Success', `${coach.displayName} is now your coach.`);
            } catch (err: any) {
              Alert.alert('Could not assign', err?.response?.data?.message || err?.message || 'Please try again.');
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Coach Profile</Text>
        <View style={tw`w-8`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={showCoachActions ? tw`pb-28` : tw`pb-8`}>
        {/* Hero */}
        <View style={tw`items-center pt-8 pb-6 px-4`}>
          <View style={[tw`w-24 h-24 rounded-full overflow-hidden mb-4 items-center justify-center`, { backgroundColor: accent + '20' }]}>
            {coach.profilePicture ? (
              <Image source={{ uri: buildImageUrl(coach.profilePicture) }} style={tw`w-full h-full`} />
            ) : (
              <MaterialIcons name="person" size={52} color={accent} />
            )}
          </View>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{coach.displayName}</Text>
          {coach.specialties && coach.specialties.length > 0 && (
            <View style={tw`flex-row flex-wrap justify-center gap-2 mt-3`}>
              {coach.specialties.map((s, i) => (
                <View key={i} style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '18' }]}>
                  <Text style={[tw`text-xs font-bold`, { color: accent }]}>{s}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={tw`mt-4 items-center`}>
            <RatingStarPicker rating={averageRating} onRatingChange={() => {}} size={22} interactive={false} />
            <Text style={[tw`text-sm font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {formatCoachRating(averageRating)}
            </Text>
            <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>Based on {totalReviews} reviews</Text>
          </View>
        </View>

        <View style={tw`px-4`}>
          {coach.bio && (
            <View style={[tw`mb-4 p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-2`, { color: subtextColor }]}>About</Text>
              <Text style={[tw`text-sm leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>{coach.bio}</Text>
            </View>
          )}

          {(coach.experienceYears ?? 0) > 0 && (
            <View style={[tw`mb-4 p-4 rounded-xl flex-row items-center gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: accent + '14' }]}>
                <MaterialIcons name="workspace-premium" size={20} color={accent} />
              </View>
              <View>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>Experience</Text>
                <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{coach.experienceYears} years coaching</Text>
              </View>
            </View>
          )}

          {coach.certifications && coach.certifications.length > 0 && (
            <View style={tw`mb-4`}>
              <Text style={[tw`text-sm font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Certifications</Text>
              {coach.certifications.map(cert => (
                <CertificationBadge key={cert.id} certification={cert} editable={false} />
              ))}
            </View>
          )}

          {coach.transformations && coach.transformations.length > 0 && (
            <View style={tw`mb-4`}>
              <Text style={[tw`text-sm font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Transformation Stories</Text>
              <TransformationCarousel transformations={coach.transformations} editable={false} />
            </View>
          )}

          {/* Reviews */}
          <View style={tw`mb-6`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Reviews ({reviews.length})</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                style={[tw`px-3 py-1.5 rounded-lg`, { backgroundColor: accent }]}
              >
                <Text style={tw`text-xs text-white font-bold`}>Write Review</Text>
              </TouchableOpacity>
            </View>

            <View style={[tw`mb-4 p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              {[5, 4, 3, 2, 1].map(stars => {
                const count = distribution[stars as keyof typeof distribution] || 0;
                const pct = totalReviews ? (count / totalReviews) * 100 : 0;
                return (
                  <View key={stars} style={tw`flex-row items-center mb-2`}>
                    <Text style={[tw`w-6 text-xs font-bold`, { color: subtextColor }]}>{stars}★</Text>
                    <View style={[tw`flex-1 h-1.5 mx-2 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: accent }} />
                    </View>
                    <Text style={[tw`w-5 text-xs text-right`, { color: subtextColor }]}>{count}</Text>
                  </View>
                );
              })}
            </View>

            {reviews.length > 0
              ? reviews.map(r => <CoachReviewCard key={r.id} review={r} />)
              : <Text style={[tw`text-sm text-center py-4`, { color: subtextColor }]}>No reviews yet</Text>
            }
          </View>
        </View>
      </ScrollView>

      {showCoachActions && (
        <View
          style={{
            borderTopWidth: 1,
            borderColor,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 14),
            backgroundColor: isDark ? '#0a0a12' : '#f8f7f5',
          }}
        >
          <View style={tw`flex-row gap-3`}>
            {!isMyCoach ? (
              <TouchableOpacity
                onPress={handleAssignThisCoach}
                disabled={assigning}
                style={[
                  tw`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl`,
                  { backgroundColor: accent, opacity: assigning ? 0.7 : 1 },
                ]}
              >
                {assigning ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="person-add" size={20} color="white" />
                    <Text style={tw`text-white font-bold`}>Choose coach</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  tw`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl`,
                  { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
              >
                <MaterialIcons name="verified" size={20} color={accent} />
                <Text style={[tw`font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Your coach</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleMessageCoach}
              style={[
                tw`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl`,
                { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor },
              ]}
            >
              <MaterialIcons name="chat-bubble" size={20} color={accent} />
              <Text style={[tw`font-bold`, { color: accent }]}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ReviewSubmissionModal
        visible={showReviewModal}
        coachName={coach.displayName}
        onSubmit={handleSubmitReview}
        onCancel={() => setShowReviewModal(false)}
      />
    </SafeAreaView>
  );
};
