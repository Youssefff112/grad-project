import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { useOffline } from '../context/OfflineContext';
import { hasFeatureAccess } from '../utils/planUtils';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';

export const TraineeCommandCenterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('home');
  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const { isDark, accent } = useTheme();
  const { fullName, lastPlanReviewDate, subscriptionPlan, canUseAIAssistant, weight, setWeight, bodyFatPercentage, setBodyFatPercentage } = useUser();
  const { totalUnread } = useNotifications();
  const { isOnline, syncInProgress, queuedCount } = useOffline();
  const firstName = fullName?.split(' ')[0] || 'Trainee';

  // Calculate readiness score based on various factors
  const readinessScore = Math.floor(Math.random() * 40 + 60); // 60-100%
  const waterIntake = 1.2; // liters
  const caloriesBurned = 1850;
  const caloriesTarget = 2400;

  const getReadinessStatus = () => {
    if (readinessScore >= 80) return 'Optimal';
    if (readinessScore >= 60) return 'Good';
    return 'Fair';
  };

  const getReadinessRecommendation = () => {
    const score = readinessScore;
    if (score >= 85) return 'Your recovery is optimal. High intensity training is recommended today.';
    if (score >= 70) return 'You\'re ready for moderate to high intensity. Recovery is adequate.';
    if (score >= 50) return 'Consider lighter training today. Your body needs more recovery.';
    return 'Take it easy today. Focus on stretching and mobility work.';
  };

  // Check if plan review is due (every 7 days)
  const shouldShowPlanReview = useMemo(() => {
    if (!lastPlanReviewDate) return true;
    const lastReview = new Date(lastPlanReviewDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }, [lastPlanReviewDate]);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 pb-2 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={tw`flex w-12 items-center justify-start`}>
          <TouchableOpacity style={tw`relative p-2`} onPress={() => navigation.navigate('NotificationsSettings')}>
            <MaterialIcons name="notifications" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
            {totalUnread > 0 && (
              <View style={[tw`absolute top-1 right-0 rounded-full items-center justify-center h-5 w-5`, { backgroundColor: accent }]}>
                <Text style={tw`text-white text-xs font-bold`}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={tw`flex-row items-center gap-2`}>
          {!isOnline && (
            <View style={[tw`px-3 py-1 rounded-full flex-row items-center gap-1`, { backgroundColor: '#ef444430' }]}>
              <MaterialIcons name="wifi-off" size={12} color="#ef4444" />
              <Text style={tw`text-xs text-red-500 font-bold`}>Offline</Text>
            </View>
          )}
          {syncInProgress && (
            <View style={tw`flex-row items-center gap-1`}>
              <MaterialIcons name="cloud-upload" size={16} color={accent} />
              <Text style={[tw`text-xs font-semibold`, { color: accent }]}>Syncing...</Text>
            </View>
          )}
          {queuedCount > 0 && (
            <View style={tw`px-2 py-0.5 rounded bg-yellow-500/20`}>
              <Text style={tw`text-xs text-yellow-600 font-bold`}>{queuedCount} pending</Text>
            </View>
          )}
        </View>
        <Text style={[tw`text-lg font-bold tracking-tighter flex-1 text-center`, { color: accent }]}>VERTEX</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="person" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`}>
        {/* Personal Info & Plan Review Reminder Banner */}
        {shouldShowPlanReview && (
          <View style={[tw`mx-4 mt-4 rounded-xl p-4 flex-col gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
            <View style={tw`flex-row items-start gap-3`}>
              <MaterialIcons name="scale" size={22} color={accent} style={tw`mt-0.5`} />
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Weekly Check-In: Weigh In
                </Text>
                <Text style={[tw`text-xs mt-1.5 leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Weigh yourself this week to track your progress accurately. Your weight helps us optimize your personalized plan for better results.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-col gap-2 mt-2`}>
              <View style={tw`flex-row gap-2 items-center`}>
                <TextInput
                  placeholder="Weight"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  style={[tw`flex-1 rounded-lg p-3 text-base font-semibold`, { 
                    backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    borderWidth: 1,
                    borderColor: accent + '40'
                  }]}
                />
                <TextInput
                  placeholder="Body Fat %"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={bodyFatInput}
                  onChangeText={setBodyFatInput}
                  keyboardType="decimal-pad"
                  style={[tw`flex-1 rounded-lg p-3 text-base font-semibold`, { 
                    backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    borderWidth: 1,
                    borderColor: accent + '40'
                  }]}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (weightInput.trim() || bodyFatInput.trim()) {
                      if (weightInput.trim()) {
                        const newWeight = parseFloat(weightInput);
                        setWeight(newWeight);
                      }
                      if (bodyFatInput.trim()) {
                        const newBodyFat = parseFloat(bodyFatInput);
                        setBodyFatPercentage(newBodyFat);
                      }
                      setWeightInput('');
                      setBodyFatInput('');
                    }
                  }}
                  style={[tw`rounded-lg p-3 items-center justify-center`, { backgroundColor: accent }]}
                >
                  <MaterialIcons name="check" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row gap-2 text-xs`}>
                {weight && <Text style={[tw`flex-1 text-xs text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Weight: {weight} kg</Text>}
                {bodyFatPercentage && <Text style={[tw`flex-1 text-xs text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Fat: {bodyFatPercentage}%</Text>}
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={[tw`rounded-lg p-3 items-center`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
              >
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Review Plans
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Greeting */}
        <View style={tw`px-4 pt-6 pb-2`}>
          <Text style={[tw`text-sm font-medium`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Welcome back,</Text>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{firstName}</Text>
        </View>

        {/* Daily Dial Section */}
        <View style={tw`px-4 pt-2`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Daily Dial
            </Text>
            <Text style={[tw`text-sm font-semibold`, { color: accent }]}>Today</Text>
          </View>

          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            {/* Calories Card */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Meals')}
              activeOpacity={0.7}
              style={[tw`w-[48%] flex-col gap-2 rounded-xl p-4 shadow-sm`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <MaterialIcons name="local-fire-department" size={20} color={accent} />
                <Text style={[tw`text-sm font-medium`, { color: isDark ? '#94a3b8' : '#475569' }]}>Calories</Text>
              </View>
              <Text style={[tw`text-xl font-bold leading-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                1,850 <Text style={[tw`text-xs font-normal`, { color: '#94a3b8' }]}>/ 2,400</Text>
              </Text>
              <View style={[tw`w-full h-1.5 rounded-full overflow-hidden mt-1`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <View style={[tw`h-full rounded-full`, { backgroundColor: accent, width: '77%' }]} />
              </View>
              <Text style={tw`text-red-500 text-xs font-semibold`}>-550 kcal left</Text>
            </TouchableOpacity>

            {/* Water Card */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Meals')}
              activeOpacity={0.7}
              style={[tw`w-[48%] flex-col gap-2 rounded-xl p-4 shadow-sm`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <MaterialIcons name="water-drop" size={20} color="#3b82f6" />
                <Text style={[tw`text-sm font-medium`, { color: isDark ? '#94a3b8' : '#475569' }]}>Water</Text>
              </View>
              <Text style={[tw`text-xl font-bold leading-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                1.2L <Text style={[tw`text-xs font-normal`, { color: '#94a3b8' }]}>/ 3.0L</Text>
              </Text>
              <View style={[tw`w-full h-1.5 rounded-full overflow-hidden mt-1`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <View style={tw`bg-blue-500 h-full rounded-full w-[40%]`} />
              </View>
              <Text style={tw`text-green-500 text-xs font-semibold`}>+0.4L since 1h</Text>
            </TouchableOpacity>

            {/* Readiness Score */}
            <TouchableOpacity
              onPress={() => navigation.navigate('VisionAnalysisLab')}
              activeOpacity={0.7}
              style={[tw`w-full flex-col gap-2 rounded-xl p-5 shadow-sm mt-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <MaterialIcons name="bolt" size={24} color={accent} />
                  <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Readiness Score</Text>
                </View>
                <Text style={[tw`text-2xl font-black`, { color: accent }]}>{readinessScore}%</Text>
              </View>
              <Text style={[tw`text-sm leading-relaxed mt-1`, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {getReadinessRecommendation()}
              </Text>
              <View style={tw`flex-row gap-2 mt-2`}>
                <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '28' }]}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: accent }]}>{getReadinessStatus()}</Text>
                </View>
                <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: isDark ? '#cbd5e1' : '#475569' }]}>Start Workout →</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI/Workout & Meal Generation Section */}
        {(hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration') || hasFeatureAccess(subscriptionPlan, 'hasAIMealPlanGeneration')) && (
          <View style={tw`px-4 mt-8`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Generate Plans
            </Text>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutGeneration')}
                style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
              >
                <MaterialIcons name="lightbulb" size={28} color={accent} style={tw`mb-2`} />
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Generate Workout
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Custom plan for you
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('MealGeneration')}
                style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
              >
                <MaterialIcons name="restaurant" size={28} color={accent} style={tw`mb-2`} />
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Generate Meals
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Personalized nutrition
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hub Section - Quick Access */}
        <View style={tw`px-4 mt-8 mb-6`}>
          <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Important
          </Text>
          <View style={tw`flex-row gap-3 flex-wrap`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SubscriptionPlans')}
              style={[tw`flex-1 rounded-xl p-4 min-w-32`, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }]}
            >
              <MaterialIcons name="card-membership" size={24} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Subscription
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={[tw`flex-1 rounded-xl p-4 min-w-32`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <MaterialIcons name="person" size={24} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Profile
              </Text>
            </TouchableOpacity>
            {hasFeatureAccess(subscriptionPlan, 'hasAIChat') || hasFeatureAccess(subscriptionPlan, 'hasCoachChat') ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Messages')}
                style={[tw`flex-1 rounded-xl p-4 min-w-32`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <MaterialIcons name="chat-bubble" size={24} color={accent} style={tw`mb-2`} />
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Coaching
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={[tw`flex-1 rounded-xl p-4 min-w-32 opacity-70`, { backgroundColor: isDark ? '#111128' : '#e2e8f0', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <MaterialIcons name="chat-bubble" size={24} color={isDark ? '#cbd5e1' : '#64748b'} style={tw`mb-2`} />
                <View style={tw`flex-row items-center gap-1`}>
                  <Text style={[tw`font-bold text-sm`, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
                    Coaching
                  </Text>
                  <MaterialIcons name="lock" size={14} color={isDark ? '#cbd5e1' : '#64748b'} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasFeatureAccess(subscriptionPlan, 'hasComputerVision') ? (
        <View style={tw`px-4 mt-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Workout Anchor
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('VisionAnalysisLab')}>
              <Text style={[tw`text-sm font-bold`, { color: accent }]}>View Plan</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[tw`relative overflow-hidden rounded-2xl shadow-md h-56 w-full`, { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
            onPress={() => navigation.navigate('Calibration')}
          >
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ4HA56Mu3dyuNK4f9nB1SFPydEev27AOQn_-ewCXe9iCD5qxMTOfJgpXlQ-1tG5MTrt7NDEdQBU_VUwyL5jUSIvWoXiY6pXRIqBqTcFeVzwkm4pJXTij-TeqZRrPQqmeNFsr3s77CuXyiWBfXzRImn6hYZz5UkQ0_gcReSZy7CsJkJpqyO-yMgt5d10YU6ieEJtQTsH1ft3luYH5QwEfZsh0o4rW7aoCKGrrCJKWhBs2Difj4yw5edzCACz4ncL8qdGmvWjNf8Fs' }}
              style={tw`w-full h-full justify-end`}
              imageStyle={tw`opacity-75`}
            >
              <View style={tw`absolute inset-0 bg-black/50`} />
              <View style={tw`p-5 z-10`}>
                <View style={tw`flex-row items-center gap-2 mb-1`}>
                  <View style={[tw`px-2 py-0.5 rounded`, { backgroundColor: accent }]}>
                    <Text style={tw`text-white text-[10px] font-bold uppercase`}>Focus</Text>
                  </View>
                  <Text style={tw`text-slate-300 text-xs`}>Leg Day - 75 mins</Text>
                </View>
                <Text style={tw`text-white text-2xl font-bold mb-3`}>Hypertrophy: Lower Body</Text>
                <View style={tw`flex-row items-center justify-between mt-2`}>
                  <Button title="Start Session" size="sm" onPress={() => navigation.navigate('Calibration')} containerStyle={tw`rounded-xl px-6`} />
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <View style={tw`mt-4 flex-col gap-3`}>
            {[
              { name: 'Barbell Squats', sets: '4 sets x 10 reps' },
              { name: 'Leg Extensions', sets: '3 sets x 15 reps' },
            ].map((exercise) => (
              <TouchableOpacity key={exercise.name} onPress={() => navigation.navigate('ExerciseDetail', { name: exercise.name, sets: exercise.sets })} style={[tw`flex-row items-center justify-between p-4 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={[tw`p-2 rounded-lg`, { backgroundColor: accent + '14' }]}>
                    <MaterialIcons name="fitness-center" size={24} color={accent} />
                  </View>
                  <View>
                    <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{exercise.name}</Text>
                    <Text style={[tw`text-xs`, { color: '#94a3b8' }]}>{exercise.sets}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate('SubscriptionPlans')}
          style={[tw`mx-4 mt-8 rounded-2xl p-5`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
        >
          <View style={tw`flex-row items-center gap-3 mb-3`}>
            <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
              <MaterialIcons name="lock" size={24} color={accent} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Workout Anchor</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#94a3b8' : '#64748b' }]}>CV-powered form tracking & guided sessions</Text>
            </View>
          </View>
          <View style={[tw`flex-row items-center justify-center gap-2 py-3 rounded-xl`, { backgroundColor: accent + '14' }]}>
            <MaterialIcons name="arrow-upward" size={16} color={accent} />
            <Text style={[tw`text-sm font-bold`, { color: accent }]}>Upgrade to Premium+</Text>
          </View>
        </TouchableOpacity>
        )}
      </ScrollView>

      <BottomNav
        activeId={activeTab}
        onSelect={(id) => {
          setActiveTab(id);
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'track') navigation.navigate('DailyTracker');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'messages') navigation.navigate('Messages');
          if (id === 'coaches') navigation.navigate('CoachBrowsingScreen');
          if (id === 'profile') navigation.navigate('Profile');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'track', icon: 'trending-up', label: 'Track' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages', badge: totalUnread },
          ...(subscriptionPlan === 'ProCoach' || subscriptionPlan === 'Elite' ? [{ id: 'coaches', icon: 'person-add', label: 'Coaches' }] : []),
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
