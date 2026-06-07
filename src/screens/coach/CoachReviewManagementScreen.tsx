import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as coachService from '../../services/coachService';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const CoachReviewManagementScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const [reviews, setReviews] = useState<coachService.Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setError(null);
    try {
      // Always fetch own coach profile to get the correct coach ID —
      // the UserContext.coachId is the *client's* selected coach, not the logged-in coach's own ID.
      const { profile } = await coachService.getMyCoachProfile();
      if (!profile?.id) {
        setReviews([]);
        return;
      }
      const { reviews: data } = await coachService.getCoachReviews(profile.id);
      setReviews(data || []);
    } catch (e: any) {
      setError('Failed to load reviews. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadReviews(); }, [loadReviews]));

  const onRefresh = () => { setRefreshing(true); loadReviews(); };

  const total = reviews.length;
  const average = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center px-4 py-3`, { borderBottomWidth: 1, borderColor: borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1 mr-3`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold flex-1`, { color: textPrimary }]}>Reviews</Text>
        <TouchableOpacity onPress={onRefresh} style={tw`p-1`}>
          <MaterialIcons name="refresh" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 py-4 pb-8`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        >
          {error && (
            <View style={[tw`p-4 rounded-xl mb-4`, { backgroundColor: '#ef444414', borderWidth: 1, borderColor: '#ef444428' }]}>
              <Text style={[tw`text-sm text-center`, { color: '#ef4444' }]}>{error}</Text>
            </View>
          )}

          {/* Summary */}
          <View style={[tw`p-6 rounded-2xl mb-6`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
            <View style={tw`flex-row items-center gap-6`}>
              <View style={tw`items-center`}>
                <Text style={[tw`text-5xl font-black`, { color: accent }]}>{total ? average.toFixed(1) : '—'}</Text>
                <View style={tw`flex-row gap-0.5 mt-1`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcons
                      key={i}
                      name={i < Math.round(average) ? 'star' : 'star-outline'}
                      size={16}
                      color={i < Math.round(average) ? accent : isDark ? '#475569' : '#cbd5e1'}
                    />
                  ))}
                </View>
                <Text style={[tw`text-xs mt-1`, { color: subtextColor }]}>{total} review{total !== 1 ? 's' : ''}</Text>
              </View>

              <View style={tw`flex-1`}>
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = distribution[stars] || 0;
                  const pct = total ? (count / total) * 100 : 0;
                  return (
                    <View key={stars} style={tw`flex-row items-center mb-1.5`}>
                      <Text style={[tw`w-5 text-xs font-bold`, { color: subtextColor }]}>{stars}★</Text>
                      <View style={[tw`flex-1 h-1.5 mx-2 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: accent }} />
                      </View>
                      <Text style={[tw`w-4 text-xs text-right`, { color: subtextColor }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Reviews list */}
          <Text style={[tw`text-sm font-bold mb-3`, { color: textPrimary }]}>All Reviews</Text>
          {reviews.length === 0 && (
            <View style={[tw`p-8 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <MaterialIcons name="star-outline" size={36} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[tw`text-sm mt-2 font-bold`, { color: subtextColor }]}>No reviews yet</Text>
              <Text style={[tw`text-xs mt-1 text-center`, { color: subtextColor }]}>
                Client reviews will appear here after they rate your services
              </Text>
            </View>
          )}
          {reviews.map(review => (
            <View key={review.id} style={[tw`p-4 rounded-xl mb-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <View style={tw`flex-row items-center gap-0.5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialIcons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={14} color={i < review.rating ? accent : isDark ? '#475569' : '#cbd5e1'} />
                  ))}
                </View>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{formatDate(review.createdAt)}</Text>
              </View>
              <Text style={[tw`text-sm font-bold mb-1.5`, { color: textPrimary }]}>
                {review.isAnonymous ? 'Anonymous' : review.authorName || 'Client'}
              </Text>
              {review.comment ? (
                <Text style={[tw`text-sm leading-relaxed`, { color: subtextColor }]}>{review.comment}</Text>
              ) : (
                <Text style={[tw`text-sm italic`, { color: subtextColor }]}>No written review</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
