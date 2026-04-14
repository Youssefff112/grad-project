import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { useFoodManagement } from '../context/FoodManagementContext';
import { useExerciseManagement } from '../context/ExerciseManagementContext';
import { BottomNav } from '../components/BottomNav';

const DAILY_TARGETS = {
  calories: 2400,
  protein: 160,
  carbs: 220,
  fats: 65,
  water: 8,
};

export const ProgressScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();
  const { totalUnread } = useNotifications();
  const { meals } = useFoodManagement();
  const { workouts } = useExerciseManagement();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const firstName = fullName ? fullName.split(' ')[0] : 'Champ';

  // Generate mock historical data for display
  const generateWeekData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      calories: 2000 + Math.random() * 600,
      meals: Math.floor(2 + Math.random() * 3),
      workouts: Math.floor(Math.random() * 2),
      water: Math.floor(5 + Math.random() * 4),
    }));
  };

  const weekData = useMemo(() => generateWeekData(), []);

  const stats = [
    {
      label: 'Meals Logged',
      value: `${meals.length}`,
      subtitle: 'custom meals',
      icon: 'restaurant',
      color: '#4ade80',
    },
    {
      label: 'Workouts Created',
      value: `${workouts.length}`,
      subtitle: 'custom routines',
      icon: 'fitness-center',
      color: '#f87171',
    },
    {
      label: 'Current Streak',
      value: '7',
      subtitle: 'days tracking',
      icon: 'local-fire-department',
      color: '#facc15',
    },
    {
      label: 'Personal Best',
      value: '94%',
      subtitle: 'calorie target',
      icon: 'trending-up',
      color: '#3b82f6',
    },
  ];

  const achievements = [
    { icon: 'sprint', label: '100+ Workouts', unlocked: false },
    { icon: 'local-fire-department', label: '7-Day Streak', unlocked: true },
    { icon: 'restaurant', label: 'Meal Master', unlocked: true },
    { icon: 'water-drop', label: 'Hydration Hero', unlocked: false },
    { icon: 'trending-up', label: 'Consistency', unlocked: true },
    { icon: 'star', label: 'Macro Expert', unlocked: false },
  ];

  const recentActivities = [
    { date: 'Today', type: 'meal', title: 'Logged 3 meals', icon: 'restaurant' },
    { date: 'Today', type: 'water', title: 'Drank 6/8 glasses', icon: 'water-drop' },
    { date: 'Yesterday', type: 'workout', title: 'Completed 45-min workout', icon: 'fitness-center' },
    { date: '2 days ago', type: 'meal', title: 'Created custom meal plan', icon: 'restaurant' },
    { date: '3 days ago', type: 'milestone', title: 'Reached 7-day streak', icon: 'local-fire-department' },
  ];

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={tw`px-5 pt-5 pb-3`}>
          <Text style={[tw`text-sm font-semibold`, { color: accent }]}>
            Progress & Analytics
          </Text>
          <Text style={[tw`text-2xl font-black mt-1`, { color: textPrimary }]}>
            Your Journey
          </Text>
          <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
            Track your fitness and nutrition progress
          </Text>
        </View>

        {/* Key Stats Grid */}
        <View style={tw`px-5 mt-4 gap-3`}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[
                tw`p-4 rounded-2xl flex-row items-center justify-between`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
              ]}
            >
              <View style={tw`flex-row items-center gap-3 flex-1`}>
                <View
                  style={[
                    tw`w-12 h-12 rounded-lg items-center justify-center`,
                    { backgroundColor: stat.color + '18' },
                  ]}
                >
                  <MaterialIcons name={stat.icon as any} size={24} color={stat.color} />
                </View>
                <View>
                  <Text style={[tw`text-xs font-semibold`, { color: textMuted }]}>
                    {stat.label}
                  </Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                    {stat.subtitle}
                  </Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-black`, { color: stat.color }]}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Weekly Overview */}
        <View style={tw`px-5 mt-6`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              This Week
            </Text>
            <View style={tw`flex-row gap-2`}>
              {(['week', 'month', 'all'] as const).map((tf) => (
                <TouchableOpacity
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  style={[
                    tw`px-3 py-1 rounded-full`,
                    {
                      backgroundColor: timeframe === tf ? accent : isDark ? '#1e293b' : '#f1f5f9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold capitalize`,
                      { color: timeframe === tf ? '#ffffff' : textSecondary },
                    ]}
                  >
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View
            style={[
              tw`p-4 rounded-2xl gap-4`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
            ]}
          >
            {/* Day Selector */}
            <View style={tw`flex-row justify-between gap-1`}>
              {weekData.map((day, i) => (
                <TouchableOpacity
                  key={day.day}
                  style={[
                    tw`flex-1 items-center py-3 rounded-lg`,
                    {
                      backgroundColor: i === 0 ? accent + '20' : isDark ? '#1e293b' : '#f1f5f9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      {
                        color: i === 0 ? accent : textSecondary,
                      },
                    ]}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={[
                      tw`text-[10px] mt-1`,
                      {
                        color: i === 0 ? accent : textMuted,
                      },
                    ]}
                  >
                    {Math.round(day.calories / 100)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats for selected day */}
            <View style={tw`gap-2 pt-2 border-t`, { borderColor: cardBorder }}>
              {[
                {
                  label: 'Calories',
                  value: `${Math.round(weekData[0].calories)}`,
                  target: '2400',
                  icon: 'local-fire-department',
                  color: accent,
                },
                {
                  label: 'Meals',
                  value: `${Math.round(weekData[0].meals)}`,
                  target: '3',
                  icon: 'restaurant',
                  color: '#4ade80',
                },
                {
                  label: 'Water',
                  value: `${Math.round(weekData[0].water)}`,
                  target: '8',
                  icon: 'water-drop',
                  color: '#38bdf8',
                },
                {
                  label: 'Workouts',
                  value: `${Math.round(weekData[0].workouts)}`,
                  target: '1',
                  icon: 'fitness-center',
                  color: '#f87171',
                },
              ].map((item) => (
                <View key={item.label} style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>{item.label}</Text>
                  </View>
                  <Text style={[tw`text-sm font-bold`, { color: item.color }]}>
                    {item.value} / {item.target}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={tw`px-5 mt-6`}>
          <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-3`, { color: textSecondary }]}>
            Achievements
          </Text>
          <View style={tw`gap-2`}>
            {achievements.map((achievement, i) => (
              <View
                key={i}
                style={[
                  tw`p-3 rounded-xl flex-row items-center gap-3`,
                  {
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: achievement.unlocked ? accent + '40' : cardBorder,
                    opacity: achievement.unlocked ? 1 : 0.5,
                  },
                ]}
              >
                <View
                  style={[
                    tw`w-12 h-12 rounded-lg items-center justify-center`,
                    {
                      backgroundColor: achievement.unlocked ? accent + '18' : isDark ? '#1e293b' : '#f1f5f9',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={achievement.unlocked ? 'star' : 'lock'}
                    size={20}
                    color={achievement.unlocked ? accent : textMuted}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                    {achievement.label}
                  </Text>
                  <Text style={[tw`text-xs`, { color: textMuted }]}>
                    {achievement.unlocked ? '✓ Unlocked' : 'Keep going!'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={tw`px-5 mt-6`}>
          <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-3`, { color: textSecondary }]}>
            Recent Activity
          </Text>
          <View style={tw`gap-2`}>
            {recentActivities.slice(0, 5).map((activity, i) => (
              <View
                key={i}
                style={[
                  tw`p-3 rounded-xl flex-row items-center gap-3`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                ]}
              >
                <View
                  style={[
                    tw`w-10 h-10 rounded-lg items-center justify-center`,
                    { backgroundColor: accent + '18' },
                  ]}
                >
                  <MaterialIcons name={activity.icon as any} size={18} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                    {activity.title}
                  </Text>
                  <Text style={[tw`text-xs`, { color: textMuted }]}>
                    {activity.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav
        activeId="progress"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'track') navigation.navigate('DailyTracker');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'messages') navigation.navigate('Messages');
          if (id === 'profile') navigation.navigate('Profile');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'track', icon: 'trending-up', label: 'Track' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages', badge: totalUnread },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
