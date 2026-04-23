import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useExerciseManagement } from '../../context/ExerciseManagementContext';
import * as offlineService from '../../services/offlineService';
import * as workoutService from '../../services/workoutService';
import { hasFeatureAccess } from '../../utils/planUtils';
import { FeatureLocked } from '../../components/FeatureLocked';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';

export const VisionAnalysisLabScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { subscriptionPlan } = useUser();
  const { totalUnread } = useNotifications();
  const { workouts } = useExerciseManagement();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [cachedHistory, setCachedHistory] = useState<Array<{
    date: string;
    type: string;
    duration: string;
    score: string;
    exercises: number;
  }> | null>(null);
  const [apiHistory, setApiHistory] = useState<workoutService.WorkoutSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load cached workout history on mount
  useEffect(() => {
    const loadCachedWorkouts = async () => {
      try {
        const cached = await offlineService.getCachedWorkoutHistory();
        if (cached && cached.length > 0) {
          setCachedHistory(cached);
        }
      } catch (error) {
        console.error('Error loading cached workouts:', error);
      }
    };
    loadCachedWorkouts();
  }, []);

  // Load real API history when history tab is opened
  useEffect(() => {
    if (activeTab === 'history') {
      loadWorkoutHistory();
    }
  }, [activeTab]);

  const loadWorkoutHistory = async () => {
    setHistoryLoading(true);
    try {
      const { logs } = await workoutService.getWorkoutHistory();
      setApiHistory(logs || []);
    } catch {
      // fall back to cached
    } finally {
      setHistoryLoading(false);
    }
  };

  // Check if user has access to computer vision
  if (!hasFeatureAccess(subscriptionPlan, 'hasComputerVision')) {
    return (
      <FeatureLocked
        featureName="Computer Vision"
        featureIcon="videocam"
        description="AI-powered form tracking and exercise analysis"
        upgradePlans={['Premium', 'ProCoach', 'Elite']}
        onUpgradePress={() => navigation.navigate('SubscriptionPlans')}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center p-4 justify-between z-10`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold leading-tight tracking-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Workouts
          </Text>
        </View>
        <TouchableOpacity style={[tw`flex items-center justify-center rounded-lg h-10 w-10`, { backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '30' }]} onPress={() => {
          setActiveTab('history');
        }}>
          <MaterialIcons name="history" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={[tw`flex-row px-4 gap-2 py-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
        {[
          { id: 'live' as const, label: 'Live Session', icon: 'videocam' },
          { id: 'history' as const, label: 'Past Sessions', icon: 'history' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
              {
                backgroundColor: activeTab === tab.id ? accent : isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <MaterialIcons name={tab.icon as any} size={18} color={activeTab === tab.id ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[tw`text-sm font-bold`, { color: activeTab === tab.id ? '#ffffff' : isDark ? '#94a3b8' : '#64748b' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'live' ? (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-32`}>
          {/* Generate Workout Button */}
          <View style={tw`px-4 pt-4 pb-2`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutGeneration')}
              style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
            >
              <MaterialIcons name="auto-awesome" size={24} color={accent} />
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-sm`, { color: accent }]}>Generate Workout</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#cbd5e1' : '#475569' }]}>Create AI-powered plan</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={accent} />
            </TouchableOpacity>
          </View>

          {/* Custom Workouts Section */}
          {workouts.length > 0 && (
            <View style={tw`px-4 pt-3 pb-2 gap-2`}>
              <View style={tw`flex-row items-center justify-between`}>
                <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  My Workouts ({workouts.length})
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('WorkoutBuilder')}
                  style={tw`px-2 py-1`}
                >
                  <MaterialIcons name="add" size={18} color={accent} />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 px-4`}>
                <View style={tw`flex-row gap-2`}>
                  {workouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      onPress={() => navigation.navigate('Calibration', { workout })}
                      style={[
                        tw`rounded-xl p-4 min-w-[160px]`,
                        { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                      ]}
                    >
                      <View style={tw`flex-row items-center justify-between mb-2`}>
                        <Text style={[tw`text-xs font-bold px-2 py-1 rounded-full`, { backgroundColor: accent + '20', color: accent }]}>
                          {workout.difficulty}
                        </Text>
                      </View>
                      <Text style={[tw`text-sm font-bold mb-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]} numberOfLines={2}>
                        {workout.name}
                      </Text>
                      <View style={[tw`gap-1 mt-2 pt-2 border-t`, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                        <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          {workout.totalExercises} exercises
                        </Text>
                        <Text style={[tw`text-xs`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          ~{workout.estimatedDuration} mins
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          {/* Button to Create Workout if none exist */}
          {!workouts.length && (
            <View style={tw`px-4 pt-2 pb-2`}>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutBuilder')}
                style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: (isDark ? '#1e293b' : '#f1f5f9'), borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <MaterialIcons name="add-circle" size={24} color={accent} />
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>Create Custom Workout</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Build your own routine</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              </TouchableOpacity>
            </View>
          )}

          {/* Camera Viewport - Empty for CV */}
          <View style={[tw`mx-4 mt-4 mb-4 rounded-2xl overflow-hidden items-center justify-center`, { backgroundColor: isDark ? '#111128' : '#e2e8f0', borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', minHeight: 280 }]}>
            <View style={tw`items-center gap-6 flex-1 justify-center py-6`}>
              <View style={[tw`w-20 h-20 rounded-full items-center justify-center`, { backgroundColor: accent + '18' }]}>
                <MaterialIcons name="videocam" size={40} color={accent} />
              </View>
              <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Camera Feed</Text>
              <Text style={[tw`text-sm text-center px-8`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Computer vision will render here during your workout session
              </Text>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-2 h-2 rounded-full bg-green-500`} />
                <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: '#4ade80' }]}>CV Engine Ready</Text>
              </View>

              {/* Start Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Calibration')}
                style={[tw`flex-row items-center justify-center gap-3 py-4 px-8 rounded-2xl mt-2`, { backgroundColor: accent, minWidth: 200 }]}
              >
                <MaterialIcons name="play-arrow" size={28} color="white" />
                <Text style={tw`text-white text-lg font-black uppercase tracking-widest`}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Controls */}
          <View style={tw`px-4 py-4 gap-3`}>
            {/* Quick Stats Row */}
            <View style={tw`flex-row gap-3`}>
              {[
                { icon: 'timer', label: 'Duration', value: '00:00' },
                { icon: 'fitness-center', label: 'Exercise', value: 'Ready' },
                { icon: 'straighten', label: 'Form Score', value: '--' },
              ].map((stat) => (
                <View key={stat.label} style={[tw`flex-1 items-center py-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <MaterialIcons name={stat.icon as any} size={18} color={accent} />
                  <Text style={[tw`text-sm font-black mt-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{stat.value}</Text>
                  <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: '#94a3b8' }]}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pt-4 gap-3 pb-32`}>
          {historyLoading ? (
            <View style={tw`flex-1 items-center justify-center py-12`}>
              <ActivityIndicator color={accent} />
              <Text style={[tw`mt-2 text-xs`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Loading history...</Text>
            </View>
          ) : apiHistory.length > 0 ? (
            apiHistory.map((session, i) => (
              <TouchableOpacity
                key={session.id || i}
                onPress={() => navigation.navigate('WorkoutSessionDetail', { session })}
                style={[tw`flex-row items-center p-4 rounded-2xl gap-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
                  <MaterialIcons name="fitness-center" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{session.day || 'Workout'}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: '#94a3b8' }]}>
                    {session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    {session.duration ? ` · ${session.duration}m` : ''}
                    {session.exercises?.length ? ` · ${session.exercises.length} exercises` : ''}
                  </Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={[tw`text-xs font-bold uppercase px-2 py-1 rounded-full`, { backgroundColor: accent + '20', color: accent }]}>
                    {session.status === 'completed' ? 'Done' : session.status || '--'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            /* Fallback to cached or placeholder */
            (cachedHistory || [
              { date: 'No history yet', type: 'Start a workout to see history', duration: '--', score: '--', exercises: 0 },
            ]).map((session, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => session.exercises > 0 && navigation.navigate('WorkoutSessionDetail', { session })}
                style={[tw`flex-row items-center p-4 rounded-2xl gap-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
                  <MaterialIcons name="fitness-center" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{session.type}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: '#94a3b8' }]}>{session.date}{session.duration !== '--' ? ` - ${session.duration}` : ''}{session.exercises > 0 ? ` - ${session.exercises} exercises` : ''}</Text>
                </View>
                {session.score !== '--' && (
                  <View style={tw`items-end`}>
                    <Text style={[tw`text-lg font-black`, { color: accent }]}>{session.score}</Text>
                    <Text style={[tw`text-[9px] font-bold uppercase`, { color: '#94a3b8' }]}>Form</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <TraineeBottomNav activeId="workouts" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};

