import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFoodManagement } from '../../context/FoodManagementContext';
import { useExerciseManagement } from '../../context/ExerciseManagementContext';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';
import * as workoutService from '../../services/workoutService';
import * as dietService from '../../services/dietService';
import * as progressService from '../../services/progressService';

const DAILY_TARGETS = {
  calories: 2400,
  protein: 160,
  carbs: 220,
  fats: 65,
  water: 8,
};

function calendarDateKey(input: string | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    return input.length >= 10 ? input.slice(0, 10) : null;
  }
  return d.toISOString().slice(0, 10);
}

function mondayStart(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(base: Date, n: number): Date {
  const x = new Date(base);
  x.setDate(base.getDate() + n);
  return x;
}

function todayMonSunIndex(): number {
  const dow = new Date().getDay();
  return dow === 0 ? 6 : dow - 1;
}

export const ProgressScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();
  const { totalUnread } = useNotifications();
  const { customMeals } = useFoodManagement();
  const meals = customMeals || [];
  const { workouts } = useExerciseManagement();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [workoutLogs, setWorkoutLogs] = useState<workoutService.WorkoutSession[]>([]);
  const [dietLogs, setDietLogs] = useState<dietService.DietLog[]>([]);
  const [measurements, setMeasurements] = useState<progressService.Measurement[]>([]);
  const [selectedWeekdayIndex, setSelectedWeekdayIndex] = useState(todayMonSunIndex);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const [workoutRes, dietRes, measurementRes] = await Promise.all([
        workoutService.getWorkoutHistory(1, 20),
        dietService.getDietHistory(1, 20),
        progressService.getMeasurements(1, 20),
      ]);
      setWorkoutLogs(workoutRes.logs || []);
      setDietLogs(dietRes.logs || []);
      setMeasurements(measurementRes.measurements || []);
    } catch {
      // use defaults
    }
  };

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const firstName = fullName ? fullName.split(' ')[0] : 'Champ';

  const weekData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mon = mondayStart();
    return labels.map((dayLabel, i) => {
      const dayDate = addDays(mon, i);
      const key = dayDate.toISOString().slice(0, 10);
      let calories = 0;
      let meals = 0;
      let workouts = 0;
      let water = 0;
      dietLogs.forEach((log) => {
        if (calendarDateKey(log.date) !== key) return;
        calories += Number(log.caloriesConsumed) || 0;
        const done = log.mealsCompleted ? Object.values(log.mealsCompleted).filter(Boolean).length : 0;
        meals += done > 0 ? done : log.status !== 'missed' ? 1 : 0;
        if (log.waterMl != null && Number(log.waterMl) > 0) {
          water += Math.round(Number(log.waterMl) / 250);
        }
      });
      workoutLogs.forEach((w) => {
        if (calendarDateKey(w.date) === key && w.status === 'completed') workouts += 1;
      });
      return { day: dayLabel, calories, meals, workouts, water };
    });
  }, [dietLogs, workoutLogs]);

  const selectedDay = weekData[selectedWeekdayIndex] ?? weekData[0];

  const stats = [
    {
      label: 'Diet Days Tracked',
      value: `${dietLogs.length || meals.length}`,
      subtitle: dietLogs.length ? 'diet logs saved' : 'custom meals',
      icon: 'restaurant',
      color: '#4ade80',
    },
    {
      label: 'Workouts Logged',
      value: `${workoutLogs.length || workouts.length}`,
      subtitle: workoutLogs.length ? 'sessions recorded' : 'custom routines',
      icon: 'fitness-center',
      color: '#f87171',
    },
    {
      label: 'Measurements',
      value: `${measurements.length}`,
      subtitle: 'body check-ins',
      icon: 'monitor-weight',
      color: '#facc15',
    },
    {
      label: 'Latest Weight',
      value: measurements.length > 0 && measurements[0].weight
        ? `${measurements[0].weight}kg`
        : '--',
      subtitle: measurements.length > 0 ? 'most recent' : 'not logged yet',
      icon: 'trending-up',
      color: '#3b82f6',
    },
  ];

  const recentActivities = useMemo(() => {
    const activities: Array<{ date: string; type: string; title: string; icon: string }> = [];

    workoutLogs.slice(0, 3).forEach(log => {
      activities.push({
        date: log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
        type: 'workout',
        title: `Workout: ${log.day || 'Session'} · ${log.duration ? log.duration + ' min' : log.status}`,
        icon: 'fitness-center',
      });
    });

    dietLogs.slice(0, 2).forEach(log => {
      activities.push({
        date: log.date ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
        type: 'meal',
        title: `Diet tracked: ${log.caloriesConsumed ? log.caloriesConsumed + ' kcal' : log.status}`,
        icon: 'restaurant',
      });
    });

    measurements.slice(0, 2).forEach(m => {
      activities.push({
        date: m.measuredAt ? new Date(m.measuredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown',
        type: 'measurement',
        title: `Check-in: ${m.weight ? m.weight + 'kg' : ''}${m.bodyFat ? ' · ' + m.bodyFat + '% fat' : ''}`,
        icon: 'monitor-weight',
      });
    });

    if (activities.length === 0) {
      return [
        { date: '--', type: 'info', title: 'No activity yet. Start tracking!', icon: 'info' },
      ];
    }

    return activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [workoutLogs, dietLogs, measurements]);

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
                  onPress={() => setSelectedWeekdayIndex(i)}
                  style={[
                    tw`flex-1 items-center py-3 rounded-lg`,
                    {
                      backgroundColor: i === selectedWeekdayIndex ? accent + '20' : isDark ? '#1e293b' : '#f1f5f9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      {
                        color: i === selectedWeekdayIndex ? accent : textSecondary,
                      },
                    ]}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={[
                      tw`text-[10px] mt-1`,
                      {
                        color: i === selectedWeekdayIndex ? accent : textMuted,
                      },
                    ]}
                  >
                    {Math.round(day.calories / 100)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats for selected day */}
            <View style={[tw`gap-2 pt-2 border-t`, { borderColor: cardBorder }]}>
              {[
                {
                  label: 'Calories',
                  value: `${Math.round(selectedDay.calories)}`,
                  target: String(DAILY_TARGETS.calories),
                  icon: 'local-fire-department',
                  color: accent,
                },
                {
                  label: 'Meals',
                  value: `${Math.round(selectedDay.meals)}`,
                  target: '3',
                  icon: 'restaurant',
                  color: '#4ade80',
                },
                {
                  label: 'Water',
                  value: `${Math.round(selectedDay.water)}`,
                  target: String(DAILY_TARGETS.water),
                  icon: 'water-drop',
                  color: '#38bdf8',
                },
                {
                  label: 'Workouts',
                  value: `${Math.round(selectedDay.workouts)}`,
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

        {/* Achievements — driven by backend when available */}
        <View style={tw`px-5 mt-6`}>
          <Text style={[tw`text-sm font-bold uppercase tracking-wider mb-3`, { color: textSecondary }]}>
            Achievements
          </Text>
          <View
            style={[
              tw`p-4 rounded-xl flex-row items-center gap-3`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
            ]}
          >
            <MaterialIcons name="emoji-events" size={24} color={textMuted} />
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>No achievements yet</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: textMuted }]}>
                Badges will appear here when the app awards them from your logged progress.
              </Text>
            </View>
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
      <TraineeBottomNav activeId="track" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};
