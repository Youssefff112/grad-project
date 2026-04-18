import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';

const MOCK_REVIEWS = [
  { id: 1, rating: 5, comment: 'Alex is an incredible coach. My transformation exceeded all expectations. Highly recommend!', authorName: 'Maria G.', createdAt: '2026-04-10T00:00:00Z', isAnonymous: false },
  { id: 2, rating: 5, comment: 'Best investment I made for my health. Lost 12kg in 3 months with his personalized plan.', authorName: 'James W.', createdAt: '2026-03-22T00:00:00Z', isAnonymous: false },
  { id: 3, rating: 4, comment: 'Great communication and very knowledgeable. Plans are well-structured and easy to follow.', authorName: 'Anonymous', createdAt: '2026-03-10T00:00:00Z', isAnonymous: true },
  { id: 4, rating: 5, comment: 'Completely changed my relationship with fitness. Patient, professional, and results-driven.', authorName: 'Sarah C.', createdAt: '2026-02-18T00:00:00Z', isAnonymous: false },
  { id: 5, rating: 4, comment: 'Solid coach. Very responsive and always adjusts the program based on feedback.', authorName: 'Mike T.', createdAt: '2026-01-30T00:00:00Z', isAnonymous: false },
];

const distribution: Record<number, number> = { 5: 3, 4: 2, 3: 0, 2: 0, 1: 0 };
const total = MOCK_REVIEWS.length;
const average = MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / total;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const CoachReviewManagementScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();

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
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Reviews</Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>
        {/* Summary */}
        <View style={[tw`p-6 rounded-2xl mb-6`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <View style={tw`flex-row items-center gap-6`}>
            <View style={tw`items-center`}>
              <Text style={[tw`text-5xl font-black`, { color: accent }]}>{average.toFixed(1)}</Text>
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
              <Text style={[tw`text-xs mt-1`, { color: subtextColor }]}>{total} reviews</Text>
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
        {MOCK_REVIEWS.map(review => (
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
              {review.isAnonymous ? 'Anonymous' : review.authorName}
            </Text>
            <Text style={[tw`text-sm leading-relaxed`, { color: subtextColor }]}>{review.comment}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
