import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { CoachReviewCard } from '../../components/coach/CoachReviewCard';
import { TransformationCarousel } from '../../components/TransformationCarousel';
import { CertificationBadge } from '../../components/CertificationBadge';
import { RatingStarPicker } from '../../components/RatingStarPicker';
import { ReviewSubmissionModal } from '../../components/ReviewSubmissionModal';
import * as coachService from '../../services/coachService';
import type { CoachDetail, Review } from '../../services/coachService';

type CoachWithDisplay = CoachDetail & { displayName: string };

const buildDisplayName = (coach: CoachDetail): string => {
  const user = (coach as any).User;
  if (user?.firstName) {
    return `${user.firstName} ${user.lastName || ''}`.trim();
  }
  return (coach as any).name || `Coach #${coach.userId}`;
};

export const CoachProfileDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { isDark, accent } = useTheme();
  const { coachId, coachName: routeCoachName } = route?.params ?? {};

  const [coach, setCoach] = useState<CoachWithDisplay | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

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
      const displayName = buildDisplayName(coachData) || routeCoachName || `Coach #${coachId}`;
      setCoach({ ...coachData, displayName });
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
  const averageRating = reviewStats?.averageRating ?? coach.rating ?? 0;
  const distribution = reviewStats?.distribution ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center justify-between px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Coach Profile</Text>
        <View style={tw`w-8`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        {/* Hero */}
        <View style={tw`items-center pt-8 pb-6 px-4`}>
          <View style={[tw`w-24 h-24 rounded-full overflow-hidden mb-4 items-center justify-center`, { backgroundColor: accent + '20' }]}>
            {coach.profilePicture ? (
              <Image source={{ uri: coach.profilePicture }} style={tw`w-full h-full`} />
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
            <Text style={[tw`text-xs mt-1`, { color: subtextColor }]}>Based on {totalReviews} reviews</Text>
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

      <ReviewSubmissionModal
        visible={showReviewModal}
        coachName={coach.displayName}
        onSubmit={handleSubmitReview}
        onCancel={() => setShowReviewModal(false)}
      />
    </SafeAreaView>
  );
};
