import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';

export const WorkoutSessionDetailScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  
  const session = route?.params?.session || {
    date: 'Yesterday',
    type: 'Push Day',
    duration: '1h 12m',
    score: '94%',
    exercises: 6,
    totalVolume: '12,450 kg',
    avgFormScore: '94%',
    maxHeartRate: '167 bpm',
    calories: 487 };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#f1f5f9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold leading-tight tracking-tight flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Session Details
        </Text>
        <View style={tw`flex size-12 items-center justify-center`} />
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-8`}>
        {/* Session Header Card */}
        <View style={[tw`mx-4 mt-6 p-6 rounded-2xl`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                {session.type}
              </Text>
              <Text style={[tw`text-sm mt-2`, { color: '#94a3b8' }]}>
                {session.date}
              </Text>
            </View>
            <View style={tw`items-end`}>
              <Text style={[tw`text-4xl font-black`, { color: accent }]}>
                {session.score}
              </Text>
              <Text style={[tw`text-xs font-bold uppercase mt-1`, { color: accent }]}>
                Form Score
              </Text>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={tw`mx-4 mt-6`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Workout Metrics
          </Text>

          <View style={tw`gap-3`}>
            {[
              { icon: 'timer', label: 'Duration', value: session.duration, color: '#3b82f6' },
              { icon: 'fitness-center', label: 'Exercises', value: session.exercises.toString(), color: accent },
              { icon: 'trending-up', label: 'Total Volume', value: session.totalVolume, color: '#10b981' },
              { icon: 'favorite', label: 'Max Heart Rate', value: session.maxHeartRate, color: '#ef4444' },
              { icon: 'local-fire-department', label: 'Calories Burned', value: session.calories.toString(), color: '#f97316' },
            ].map((metric, i) => (
              <View key={i} style={[tw`flex-row items-center p-4 rounded-xl gap-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[tw`w-12 h-12 rounded-lg items-center justify-center`, { backgroundColor: metric.color + '18' }]}>
                  <MaterialIcons name={metric.icon as any} size={24} color={metric.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: '#94a3b8' }]}>
                    {metric.label}
                  </Text>
                  <Text style={[tw`text-lg font-bold mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {metric.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Exercise Breakdown */}
        <View style={tw`mx-4 mt-6 mb-4`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Exercises Completed
          </Text>

          <View style={tw`gap-3`}>
            {[
              { name: 'Barbell Bench Press', sets: '4x8', weight: '110kg', score: '96%' },
              { name: 'Dumbbell Incline Press', sets: '3x10', weight: '32kg', score: '92%' },
              { name: 'Barbell Decline Press', sets: '3x8', weight: '100kg', score: '95%' },
              { name: 'Cable Flyes', sets: '3x12', weight: '35kg', score: '91%' },
              { name: 'Machine Chest Press', sets: '2x12', weight: '90kg', score: '94%' },
              { name: 'Pushups (Chest Focused)', sets: '2x8', weight: 'BW', score: '93%' },
            ].map((exercise, i) => (
              <View key={i} style={[tw`p-4 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                      {exercise.name}
                    </Text>
                    <Text style={[tw`text-xs mt-1`, { color: '#94a3b8' }]}>
                      {exercise.sets} @ {exercise.weight}
                    </Text>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={[tw`font-bold text-lg`, { color: accent }]}>
                      {exercise.score}
                    </Text>
                    <Text style={[tw`text-[9px] font-bold uppercase`, { color: '#94a3b8' }]}>
                      Form Score
                    </Text>
                  </View>
                </View>

                {/* Mini progress bar */}
                <View style={[tw`h-1.5 rounded-full w-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        backgroundColor: accent,
                        width: exercise.score.slice(0, -1) + '%' },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* PRs and Achievements */}
        <View style={tw`mx-4 mt-6 mb-4`}>
          <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Achievements
          </Text>

          <View style={tw`gap-2`}>
            {[
              '✨ New personal record on Barbell Bench Press',
              '🔥 Form score above 90% on all exercises',
              '⚡ 487 calories burned (high intensity)',
              '🎯 Completed all planned sets',
            ].map((achievement, i) => (
              <View key={i} style={[tw`flex-row items-center p-3 rounded-lg gap-3`, { backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '20' }]}>
                <Text style={[tw`flex-1 text-sm font-medium`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  {achievement}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[tw`px-4 py-4 border-t`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Button
          title="Start Similar Workout"
          variant="primary"
          onPress={() => {
            navigation.navigate('Calibration');
          }}
          containerStyle={tw`w-full`}
        />
      </View>
    </SafeAreaView>
  );
};
